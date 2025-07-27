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


@agents_routes_router.put("/stops/{stop_id}/status")
async def update_stop_status(
    stop_id: uuid.UUID,
    status_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Enhanced endpoint for agents to update stop status with multiple status options.
    Supports: 'pending', 'in_progress', 'completed', 'failed'
    """
    valid_statuses = ['pending', 'in_progress', 'completed', 'failed']
    new_status = status_data.get('status')
    
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    # Verify the agent owns this stop
    query = select(RouteStop).join(DeliveryRoute).where(
        RouteStop.id == stop_id,
        DeliveryRoute.agent_id == uuid.UUID(current_user.get("user_id"))
    )
    stop_to_update = (await db.execute(query)).scalar_one_or_none()

    if not stop_to_update:
        raise HTTPException(status_code=404, detail="Stop not found or not part of your route.")

    # Update the stop status
    old_status = stop_to_update.status
    stop_to_update.status = new_status
    
    # If this stop is completed, check if entire route should be marked completed
    if new_status == 'completed':
        route_query = select(DeliveryRoute).options(
            selectinload(DeliveryRoute.stops)
        ).where(DeliveryRoute.id == stop_to_update.route_id)
        route = (await db.execute(route_query)).scalar_one()
        
        # Check if all stops are completed
        all_completed = all(stop.status == 'completed' for stop in route.stops)
        if all_completed:
            route.status = 'completed'

    await db.commit()

    return {
        "message": f"Stop status updated from '{old_status}' to '{new_status}'",
        "stop_id": stop_id,
        "old_status": old_status,
        "new_status": new_status,
        "stop_type": stop_to_update.stop_type
    }


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


@agents_routes_router.get("/me/route-progress")
async def get_route_progress(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for agents to get real-time progress of their current route.
    Shows completed, pending, and failed stops with progress percentage.
    """
    agent_id = uuid.UUID(current_user.get("user_id"))
    
    # Get today's route with all stops
    query = select(DeliveryRoute).options(
        selectinload(DeliveryRoute.stops).selectinload(RouteStop.profile)
    ).where(
        DeliveryRoute.agent_id == agent_id,
        DeliveryRoute.route_date == date.today()
    )
    route = (await db.execute(query)).scalar_one_or_none()

    if not route:
        return {
            "message": "No route assigned for today",
            "route_id": None,
            "progress": 0,
            "stops_summary": {}
        }

    # Calculate progress statistics
    total_stops = len(route.stops)
    completed_stops = sum(1 for stop in route.stops if stop.status == 'completed')
    pending_stops = sum(1 for stop in route.stops if stop.status == 'pending')
    in_progress_stops = sum(1 for stop in route.stops if stop.status == 'in_progress')
    failed_stops = sum(1 for stop in route.stops if stop.status == 'failed')
    
    progress_percentage = (completed_stops / total_stops * 100) if total_stops > 0 else 0

    # Find current/next stop
    current_stop = None
    for stop in sorted(route.stops, key=lambda s: s.sequence_order):
        if stop.status in ['pending', 'in_progress']:
            current_stop = {
                "id": stop.id,
                "type": stop.stop_type,
                "sequence": stop.sequence_order,
                "profile_name": stop.profile.full_name if stop.profile else "Unknown",
                "status": stop.status
            }
            break

    return {
        "route_id": route.id,
        "route_status": route.status,
        "progress_percentage": round(progress_percentage, 1),
        "stops_summary": {
            "total": total_stops,
            "completed": completed_stops,
            "pending": pending_stops,
            "in_progress": in_progress_stops,
            "failed": failed_stops
        },
        "current_stop": current_stop,
        "message": f"Route {progress_percentage:.1f}% complete ({completed_stops}/{total_stops} stops)"
    }