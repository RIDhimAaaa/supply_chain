from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from models import DeliveryRoute, RouteStop, CartItem, Product
import uuid
from datetime import date
from typing import List

from dependencies.rbac import require_permission
from dependencies.get_current_user import get_current_user
from config import get_db
from models import DeliveryRoute, RouteStop
from .schemas import RouteSchema # Import schemas from this folder


agents_routes_router = APIRouter(prefix="/agent-routes", tags=["Agent Delivery Routes"])

@agents_routes_router.get("/me/today", response_model=RouteSchema)
async def get_my_route_for_today(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a delivery agent to get their assigned route for the day."""
    agent_id = current_user.get("user_id")
    
    query = select(DeliveryRoute).options(
        selectinload(DeliveryRoute.stops).selectinload(RouteStop.profile)
    ).where(
        DeliveryRoute.agent_id == uuid.UUID(agent_id),
        DeliveryRoute.route_date == date.today()
    )
    route = (await db.execute(query)).scalar_one_or_none()

    if not route:
        raise HTTPException(status_code=404, detail="No route assigned for you today.")

    # Format the response to include necessary details for the agent's app
    response_stops = []
    for stop in route.stops:
        # Check if location exists before trying to access its properties
        location_data = None
        if stop.profile and stop.profile.location:
            # Supabase GEOGRAPHY(Point) is stored as (x, y) which maps to (lng, lat)
            location_data = {"lng": stop.profile.location.x, "lat": stop.profile.location.y}

        response_stops.append({
            "id": stop.id,
            "stop_type": stop.stop_type,
            "status": stop.status,
            "sequence_order": stop.sequence_order,
            "profile_name": stop.profile.full_name if stop.profile else "Unknown",
            "location": location_data
        })
    
    return {"id": route.id, "status": route.status, "stops": response_stops}


@agents_routes_router.put(
    "/stops/{stop_id}/complete",
    dependencies=[Depends(require_permission(resource="orders", permission="write"))]
)
async def complete_a_stop(
    stop_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for an agent to mark a stop as complete."""
    agent_id = current_user.get("user_id")

    # Verify the stop belongs to the agent's current route before updating
    query = select(RouteStop).join(DeliveryRoute).where(
        RouteStop.id == stop_id,
        DeliveryRoute.agent_id == uuid.UUID(agent_id)
    )
    stop_to_update = (await db.execute(query)).scalar_one_or_none()

    if not stop_to_update:
        raise HTTPException(status_code=404, detail="Stop not found or not part of your route.")

    stop_to_update.status = 'completed'
    await db.commit()

    return {"message": "Stop marked as complete."}

# In routers/agents_routes/routes.py

# ... (keep all your existing code)

@agents_routes_router.get("/stops/{stop_id}/manifest")
async def get_stop_manifest(
    stop_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for an agent to get the detailed checklist for a specific stop.
    For a 'pickup' stop, it lists all items to collect from the supplier.
    For a 'delivery' stop, it lists all items to drop off to the vendor.
    """
    # First, verify the agent is assigned to this stop
    stop_query = select(RouteStop).join(DeliveryRoute).where(
        RouteStop.id == stop_id,
        DeliveryRoute.agent_id == uuid.UUID(current_user.get("user_id"))
    )
    stop = (await db.execute(stop_query)).scalar_one_or_none()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found or not part of your route.")

    # Now, find all the finalized cart items related to this stop's profile (supplier or vendor)
    if stop.stop_type == 'pickup':
        # Find all items supplied by this profile on today's route
        manifest_query = select(CartItem).join(Product).where(
            Product.supplier_id == stop.profile_id,
            CartItem.is_finalized == True,
            # This date check is important to only get today's orders
            select(DeliveryRoute.route_date).where(DeliveryRoute.id == stop.route_id).as_scalar() == date.today()
        )
    else: # stop_type == 'delivery'
        # Find all items for this vendor on today's route
        manifest_query = select(CartItem).where(
            CartItem.vendor_id == stop.profile_id,
            CartItem.is_finalized == True,
            select(DeliveryRoute.route_date).where(DeliveryRoute.id == stop.route_id).as_scalar() == date.today()
        )
    
    items_result = await db.execute(manifest_query.options(selectinload(CartItem.product)))
    items = items_result.scalars().all()

    # Format the response
    manifest = [
        {"product_name": item.product.name, "quantity": item.quantity, "unit": item.product.unit}
        for item in items
    ]
    
    return manifest