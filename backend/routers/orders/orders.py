from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid
from collections import defaultdict
from datetime import date
from typing import List
from ..cart.schemas import CartItem as CartItemSchema

from dependencies.rbac import require_permission
from dependencies.get_current_user import get_current_user
from config import get_db
from models import CartItem, Product, Deal, Profile, Role, DeliveryRoute, RouteStop
from .schemas import OrderStatus # Import the schema from this folder

orders_router = APIRouter(prefix="/orders", tags=["Orders & Tracking"])

@orders_router.post(
    "/finalize-and-route",
    dependencies=[Depends(require_permission(resource="admin", permission="write"))]
)
async def finalize_and_create_routes(db: AsyncSession = Depends(get_db)):
    """
    THE BRAIN: This admin-only endpoint runs after the order window closes.
    1. Finalizes all cart items with the best possible deal price.
    2. Generates a simple, non-optimized pickup and delivery route.
    3. Assigns the route to an available delivery agent.
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

    # --- NEW Part 1.5: Deduct Payments from Wallets ---
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
            else:
                # In a real app, you'd handle this failure (e.g., cancel order, notify)
                # For the hackathon, we can log it and proceed.
                print(f"WARNING: Vendor {vendor_id} has insufficient funds!")
        else:
            print(f"ERROR: Could not find profile for vendor {vendor_id} to deduct payment.")

    # --- Part 2: Generate Route (The "Logistics Engine") ---
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
    return {"message": "Orders finalized and route created successfully!", "route_id": new_route.id}


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

