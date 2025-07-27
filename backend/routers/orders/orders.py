from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid
from collections import defaultdict
from datetime import date
from typing import List
from ..cart.schemas import CartItem as CartItemSchema
from dependencies.security import verify_internal_secret

from dependencies.rbac import require_permission
from dependencies.get_current_user import get_current_user
from config import get_db
from models import CartItem, Product, Deal, Profile, Role, DeliveryRoute, RouteStop
from .schemas import OrderStatus, DeliveryConfirmation, DeliveryFeedback # Import the schema from this folder
from utils.notifications import send_order_confirmation_sms # Import the new mock function

orders_router = APIRouter(prefix="/orders", tags=["Orders & Tracking"])

@orders_router.post(
    "/finalize-and-route",
    dependencies=[Depends(verify_internal_secret)]
)
async def finalize_and_create_routes(db: AsyncSession = Depends(get_db)):
    """
    THE BRAIN: This endpoint runs automatically via cron job.
    1. Finalizes all cart items with the best possible deal price.
    2. Deducts payment from vendor wallets and sends notifications.
    3. Generates and assigns the delivery route.
    """
    # --- Part 1: Finalize Deals (The "Deal Activation Engine") ---
    cart_query = select(CartItem).options(
        selectinload(CartItem.product).selectinload(Product.deals)
    ).where(CartItem.is_finalized == False)
    all_items = (await db.execute(cart_query)).scalars().all()

    if not all_items:
        return {"message": "No pending orders to finalize."}

    total_demand = defaultdict(int)
    for item in all_items:
        total_demand[item.product_id] += item.quantity

    for item in all_items:
        best_discount = 0.0
        for deal in item.product.deals:
            if total_demand[item.product_id] >= deal.threshold and deal.discount > best_discount:
                best_discount = float(deal.discount)
        
        item.final_price = float(item.product.base_price) * (1 - best_discount)
        item.is_finalized = True

    # --- Part 2: Deduct Payments & Send Notifications ---
    vendor_totals = defaultdict(float)
    for item in all_items:
        vendor_totals[item.vendor_id] += float(item.final_price) * item.quantity

    # Fetch all relevant vendor profiles at once
    vendor_ids = list(vendor_totals.keys())
    profiles_query = select(Profile).where(Profile.id.in_(vendor_ids))
    vendor_profiles = (await db.execute(profiles_query)).scalars().all()
    
    profile_map = {p.id: p for p in vendor_profiles}

    for vendor_id, total_cost in vendor_totals.items():
        if vendor_id in profile_map:
            vendor_profile = profile_map[vendor_id]
            if vendor_profile.wallet_balance >= total_cost:
                vendor_profile.wallet_balance -= total_cost
                
                # --- NEW LOGIC: Send SMS notification after successful payment ---
                if vendor_profile.phone:
                    await send_order_confirmation_sms(
                        phone_number=vendor_profile.phone,
                        final_cost=total_cost,
                        vendor_name=vendor_profile.full_name
                    )
                # -----------------------------
                
            else:
                # In a real app, you'd handle this failure (e.g., cancel order, notify)
                # For the hackathon, we can log it and proceed.
                print(f"WARNING: Vendor {vendor_id} has insufficient funds!")
        else:
            print(f"ERROR: Could not find profile for vendor {vendor_id} to deduct payment.")

    # --- Part 3: Generate Route (The "Logistics Engine") ---
    agent_query = select(Profile).join(Role).where(Role.name == 'agent')
    agent = (await db.execute(agent_query)).scalars().first()
    if not agent:
        raise HTTPException(status_code=500, detail="No delivery agents available to assign route.")

    new_route = DeliveryRoute(id=uuid.uuid4(), agent_id=agent.id)
    db.add(new_route)
    
    pickups = defaultdict(list)
    deliveries = defaultdict(list)
    for item in all_items:
        pickups[item.product.supplier_id].append(item)
        deliveries[item.vendor_id].append(item)

    sequence = 1
    # Create PICKUP stops
    for supplier_id in pickups.keys():
        db.add(RouteStop(id=uuid.uuid4(), route=new_route, stop_type='pickup', profile_id=supplier_id, sequence_order=sequence))
        sequence += 1
    # Create DELIVERY stops
    for vendor_id in deliveries.keys():
        db.add(RouteStop(id=uuid.uuid4(), route=new_route, stop_type='delivery', profile_id=vendor_id, sequence_order=sequence))
        sequence += 1

    await db.commit()
    return {"message": "Orders finalized, payments deducted, notifications sent, and route created successfully!", "route_id": new_route.id}


@orders_router.get("/me/latest-status", response_model=OrderStatus)
async def get_my_latest_order_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for a vendor to track their most recent finalized order
    with a detailed, point-to-point status.
    """
    vendor_id_str = current_user.get("user_id")
    vendor_id = uuid.UUID(vendor_id_str)

    # Find the vendor's delivery stop on today's route
    stop_query = select(RouteStop).join(DeliveryRoute).where(
        RouteStop.profile_id == vendor_id,
        RouteStop.stop_type == 'delivery',
        DeliveryRoute.route_date == date.today()
    )
    delivery_stop = (await db.execute(stop_query)).scalar_one_or_none()

    # Case 1: No route has been generated for the vendor yet.
    if not delivery_stop:
        # Check if they have a finalized order to give a more accurate message.
        finalized_item_query = select(CartItem.id).where(
            CartItem.vendor_id == vendor_id,
            CartItem.is_finalized == True
        ).limit(1)
        has_finalized_order = (await db.execute(finalized_item_query)).scalar_one_or_none()
        
        if has_finalized_order:
            return {"status": "Order Finalized", "details": "Your order is being prepared for dispatch."}
        else:
            return {"status": "Order Placed", "details": "Awaiting finalization after 11:30 PM."}

    # Case 2: The vendor's own delivery is already marked as complete.
    if delivery_stop.status == 'completed':
        return {"status": "Delivered", "details": "Your order has been successfully delivered."}

    # Case 3: The route exists. Let's find the agent's current position.
    # Get the full route with all stops and the profile info for each stop (supplier/vendor name).
    route_query = select(DeliveryRoute).options(
        selectinload(DeliveryRoute.stops).selectinload(RouteStop.profile)
    ).where(DeliveryRoute.id == delivery_stop.route_id)
    route = (await db.execute(route_query)).scalar_one()

    # Find the first stop in the sequence that is still 'pending'. This is the agent's current task.
    current_active_stop = None
    for stop in sorted(route.stops, key=lambda s: s.sequence_order):
        if stop.status == 'pending':
            current_active_stop = stop
            break
    
    if not current_active_stop:
         return {"status": "Finalizing Delivery", "details": "The agent is completing the last steps of their route."}

    # Now, build the detailed status message based on the agent's current active stop.
    if current_active_stop.stop_type == 'pickup':
        return {
            "status": "Agent is Collecting Goods",
            "details": f"Currently at {current_active_stop.profile.full_name} (Stop {current_active_stop.sequence_order}/{len(route.stops)})"
        }
    
    # If the active stop is a delivery...
    if current_active_stop.id == delivery_stop.id:
        # The active stop is the vendor's own.
        return {
            "status": "Out for Delivery",
            "details": "The agent is on their way to you now!"
        }
    else:
        # The agent is delivering to another vendor before this one.
        return {
            "status": "Making Other Deliveries",
            "details": f"Agent is currently at {current_active_stop.profile.full_name}. You are stop #{delivery_stop.sequence_order}."
        }


@orders_router.get(
    "/me/history",
    response_model=List[CartItemSchema],
    dependencies=[Depends(require_permission(resource="orders", permission="read"))]
)
async def get_my_order_history(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for a vendor to see a list of all their past, finalized order items.
    """
    vendor_id = uuid.UUID(current_user.get("user_id"))

    query = select(CartItem).options(
        selectinload(CartItem.product) # Load the product details for each item
    ).where(
        CartItem.vendor_id == vendor_id,
        CartItem.is_finalized == True
    ).order_by(CartItem.finalized_at.desc()) # Show most recent orders first

    result = await db.execute(query)
    order_history = result.scalars().all()

    return order_history


@orders_router.post(
    "/me/confirm-delivery",
    response_model=DeliveryFeedback,
    dependencies=[Depends(require_permission(resource="orders", permission="write"))]
)
async def confirm_delivery_receipt(
    confirmation: DeliveryConfirmation,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for vendors to confirm receipt of their delivery and provide feedback.
    This marks the order as completely fulfilled in the system.
    """
    from datetime import datetime
    
    vendor_id = uuid.UUID(current_user.get("user_id"))

    # Check if vendor has any delivered orders today
    delivered_orders_query = select(CartItem).where(
        CartItem.vendor_id == vendor_id,
        CartItem.is_finalized == True,
        CartItem.finalized_at >= date.today()
    )
    delivered_orders = (await db.execute(delivered_orders_query)).scalars().all()

    if not delivered_orders:
        raise HTTPException(
            status_code=404, 
            detail="No delivered orders found for today to confirm"
        )

    # Create a confirmation record (in production, this would be a separate table)
    confirmation_id = uuid.uuid4()
    confirmation_time = datetime.now()

    # Update all today's orders with delivery confirmation status
    for order in delivered_orders:
        # Add delivery confirmation fields (ideally this would be in a separate table)
        order.delivery_confirmed = confirmation.received
        order.delivery_rating = confirmation.rating
        order.delivery_feedback = confirmation.feedback
        order.confirmed_at = confirmation_time

    await db.commit()

    # Return confirmation details
    return DeliveryFeedback(
        confirmation_id=confirmation_id,
        vendor_id=vendor_id,
        order_date=date.today().isoformat(),
        received=confirmation.received,
        rating=confirmation.rating,
        feedback=confirmation.feedback,
        missing_items=confirmation.missing_items,
        damaged_items=confirmation.damaged_items,
        confirmed_at=confirmation_time.isoformat()
    )


@orders_router.get(
    "/me/delivery-history",
    dependencies=[Depends(require_permission(resource="orders", permission="read"))]
)
async def get_delivery_confirmations(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for vendors to view their delivery confirmation history.
    Shows past feedback and ratings given for deliveries.
    """
    vendor_id = uuid.UUID(current_user.get("user_id"))

    # Get all confirmed deliveries for this vendor
    confirmed_orders_query = select(CartItem).options(
        selectinload(CartItem.product)
    ).where(
        CartItem.vendor_id == vendor_id,
        CartItem.is_finalized == True
    ).order_by(CartItem.finalized_at.desc())

    result = await db.execute(confirmed_orders_query)
    confirmed_orders = result.scalars().all()

    delivery_history = []
    for order in confirmed_orders:
        # Check if this order has confirmation data (simulated)
        has_confirmation = hasattr(order, 'delivery_confirmed') and order.delivery_confirmed is not None
        
        delivery_history.append({
            "order_id": order.id,
            "product_name": order.product.name if order.product else "Unknown",
            "quantity": order.quantity,
            "final_price": float(order.final_price) if order.final_price else 0.0,
            "finalized_at": order.finalized_at.isoformat() if order.finalized_at else None,
            "confirmed": has_confirmation,
            "rating": getattr(order, 'delivery_rating', None) if has_confirmation else None,
            "feedback": getattr(order, 'delivery_feedback', None) if has_confirmation else None,
            "confirmed_at": getattr(order, 'confirmed_at', None).isoformat() if has_confirmation and hasattr(order, 'confirmed_at') else None
        })

    # Calculate summary statistics
    total_orders = len(delivery_history)
    confirmed_orders = sum(1 for order in delivery_history if order["confirmed"])
    avg_rating = None
    
    if confirmed_orders > 0:
        ratings = [order["rating"] for order in delivery_history if order["rating"] is not None]
        if ratings:
            avg_rating = round(sum(ratings) / len(ratings), 1)

    return {
        "summary": {
            "total_orders": total_orders,
            "confirmed_deliveries": confirmed_orders,
            "pending_confirmations": total_orders - confirmed_orders,
            "average_rating": avg_rating
        },
        "delivery_history": delivery_history
    }


@orders_router.get(
    "/me/pending-confirmations",
    dependencies=[Depends(require_permission(resource="orders", permission="read"))]
)
async def get_pending_delivery_confirmations(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for vendors to see orders that have been delivered but not yet confirmed.
    """
    vendor_id = uuid.UUID(current_user.get("user_id"))

    # Find vendor's delivery stop for today
    stop_query = select(RouteStop).join(DeliveryRoute).where(
        RouteStop.profile_id == vendor_id,
        RouteStop.stop_type == 'delivery',
        RouteStop.status == 'completed',  # Delivery completed by agent
        DeliveryRoute.route_date == date.today()
    )
    delivery_stop = (await db.execute(stop_query)).scalar_one_or_none()

    if not delivery_stop:
        return {
            "message": "No completed deliveries found for today",
            "pending_orders": [],
            "needs_confirmation": False
        }

    # Get all finalized orders for today that haven't been confirmed
    pending_orders_query = select(CartItem).options(
        selectinload(CartItem.product)
    ).where(
        CartItem.vendor_id == vendor_id,
        CartItem.is_finalized == True,
        CartItem.finalized_at >= date.today()
    )

    result = await db.execute(pending_orders_query)
    pending_orders = result.scalars().all()

    # Filter out already confirmed orders (simulated check)
    unconfirmed_orders = []
    for order in pending_orders:
        is_confirmed = hasattr(order, 'delivery_confirmed') and order.delivery_confirmed is not None
        if not is_confirmed:
            unconfirmed_orders.append({
                "order_id": order.id,
                "product_name": order.product.name if order.product else "Unknown",
                "quantity": order.quantity,
                "final_price": float(order.final_price) if order.final_price else 0.0,
                "finalized_at": order.finalized_at.isoformat() if order.finalized_at else None
            })

    return {
        "message": f"You have {len(unconfirmed_orders)} deliveries waiting for confirmation" if unconfirmed_orders else "All deliveries confirmed!",
        "pending_orders": unconfirmed_orders,
        "needs_confirmation": len(unconfirmed_orders) > 0,
        "total_pending": len(unconfirmed_orders)
    }

