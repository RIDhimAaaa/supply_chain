from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid
from collections import defaultdict
from datetime import date

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
    """Endpoint for a vendor to track their most recent finalized order."""
    vendor_id = current_user.get("user_id")

    # Find the delivery stop for this vendor on today's route
    stop_query = select(RouteStop).join(DeliveryRoute).where(
        RouteStop.profile_id == uuid.UUID(vendor_id),
        RouteStop.stop_type == 'delivery',
        DeliveryRoute.route_date == date.today()
    )
    delivery_stop = (await db.execute(stop_query)).scalar_one_or_none()

    if not delivery_stop:
        return {"status": "Order Placed", "details": "Awaiting finalization and routing after 11:30 PM."}

    if delivery_stop.status == 'completed':
        return {"status": "Delivered", "details": "Your order has been delivered."}

    # If the stop exists, get the full route to check progress
    route_query = select(DeliveryRoute).options(selectinload(DeliveryRoute.stops)).where(DeliveryRoute.id == delivery_stop.route_id)
    route = (await db.execute(route_query)).scalar_one()
    
    completed_stops_count = sum(1 for s in route.stops if s.status == 'completed')
    
    if completed_stops_count < delivery_stop.sequence_order:
         return {"status": "In Progress", "details": f"Agent is on their route. You are stop #{delivery_stop.sequence_order}. {completed_stops_count} of {len(route.stops)} stops completed."}
    
    return {"status": "Out for Delivery", "details": "The agent should be arriving shortly!"}
