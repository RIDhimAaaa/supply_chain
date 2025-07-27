from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid
from datetime import date
from typing import List

from dependencies.rbac import require_permission
from dependencies.get_current_user import get_current_user
from config import get_db
from models import DeliveryRoute, RouteStop, CartItem, Product
from .schemas import RouteSchema, StopSchema # Make sure both are imported

agents_routes_router = APIRouter(prefix="/agent-routes", tags=["Agent Delivery Routes"])

# --- This endpoint remains the same ---
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

    response_stops = []
    for stop in route.stops:
        location_data = None
        if stop.profile and stop.profile.location:
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


# --- This is the endpoint with the NEW, improved logic ---
@agents_routes_router.get("/stops/{stop_id}/manifest")
async def get_stop_manifest(
    stop_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for an agent to get the detailed checklist for a specific stop.
    For a 'pickup' stop, it now lists the breakdown by vendor for on-site sorting.
    For a 'delivery' stop, it lists the items for that specific vendor.
    """
    # Verify the agent is assigned to this stop
    stop_query = select(RouteStop).where(
        RouteStop.id == stop_id,
        RouteStop.route.has(agent_id=uuid.UUID(current_user.get("user_id")))
    )
    stop = (await db.execute(stop_query)).scalar_one_or_none()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found or not part of your route.")

    # Get all finalized cart items for today's route
    base_items_query = select(CartItem).where(
        CartItem.is_finalized == True,
        select(DeliveryRoute.route_date).where(DeliveryRoute.id == stop.route_id).as_scalar() == date.today()
    )

    if stop.stop_type == 'pickup':
        # **NEW LOGIC FOR PICKUP**
        # Get all items from this specific supplier and load the vendor's name
        manifest_query = base_items_query.join(Product).where(
            Product.supplier_id == stop.profile_id
        ).options(
            selectinload(CartItem.product),
            selectinload(CartItem.vendor) # Eager load the vendor's profile
        )
        items_result = await db.execute(manifest_query)
        items = items_result.scalars().all()
        
        # Format the response to be a detailed breakdown
        manifest = [
            {
                "for_vendor": item.vendor.full_name,
                "product_name": item.product.name, 
                "quantity": item.quantity, 
                "unit": item.product.unit
            }
            for item in items
        ]
        return manifest

    else: # stop_type == 'delivery'
        # **LOGIC FOR DELIVERY REMAINS THE SAME**
        # Get all items for this specific vendor
        manifest_query = base_items_query.where(
            CartItem.vendor_id == stop.profile_id
        ).options(selectinload(CartItem.product))
        
        items_result = await db.execute(manifest_query)
        items = items_result.scalars().all()

        manifest = [
            {"product_name": item.product.name, "quantity": item.quantity, "unit": item.product.unit}
            for item in items
        ]
        return manifest


# --- This endpoint remains the same ---
@agents_routes_router.put("/stops/{stop_id}/complete")
async def complete_a_stop(
    stop_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for an agent to mark a stop as complete."""
    query = select(RouteStop).join(DeliveryRoute).where(
        RouteStop.id == stop_id,
        DeliveryRoute.agent_id == uuid.UUID(current_user.get("user_id"))
    )
    stop_to_update = (await db.execute(query)).scalar_one_or_none()

    if not stop_to_update:
        raise HTTPException(status_code=404, detail="Stop not found or not part of your route.")

    stop_to_update.status = 'completed'
    await db.commit()

    return {"message": "Stop marked as complete."}