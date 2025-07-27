from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from dependencies.rbac import require_permission
from dependencies.get_current_user import get_current_user
from config import get_db
from models import CartItem as CartItemModel
from .schemas import CartItemUpdate, CartItemSchema, CartItemCreate, CartResponse

cart_router = APIRouter(prefix="/cart", tags=["Cart"])

@cart_router.post(
    "/items",
    response_model=CartItemSchema,
    dependencies=[Depends(require_permission(resource="cart", permission="write"))]
)
async def add_item_to_cart(
    item_data: CartItemCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a vendor to add an item to their cart."""
    vendor_id_str = current_user.get("user_id")
    
    # Check if item already exists in cart for this vendor
    existing_query = select(CartItemModel).where(
        CartItemModel.vendor_id == uuid.UUID(vendor_id_str),
        CartItemModel.product_id == item_data.product_id,
        CartItemModel.is_finalized == False
    )
    existing_result = await db.execute(existing_query)
    existing_item = existing_result.scalar_one_or_none()
    
    if existing_item:
        # Update quantity if item already exists
        existing_item.quantity += item_data.quantity
        await db.commit()
        await db.refresh(existing_item)
        return existing_item
    else:
        # Create new cart item
        new_item = CartItemModel(
            vendor_id=uuid.UUID(vendor_id_str),
            product_id=item_data.product_id,
            quantity=item_data.quantity
        )
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)
        return new_item

@cart_router.get(
    "/",
    response_model=CartResponse,
    dependencies=[Depends(require_permission(resource="cart", permission="read"))]
)
async def get_my_cart(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a vendor to view their cart."""
    vendor_id_str = current_user.get("user_id")
    
    query = select(CartItemModel).where(
        CartItemModel.vendor_id == uuid.UUID(vendor_id_str),
        CartItemModel.is_finalized == False
    )
    result = await db.execute(query)
    cart_items = result.scalars().all()
    
    # Calculate estimated total
    estimated_total = 0.0
    for item in cart_items:
        if item.final_price:
            estimated_total += float(item.final_price)
    
    return CartResponse(
        items=cart_items,
        total_items=len(cart_items),
        estimated_total=estimated_total if estimated_total > 0 else None
    )

@cart_router.put(
    "/items/{item_id}",
    response_model=CartItemSchema,
    dependencies=[Depends(require_permission(resource="cart", permission="write"))]
)
async def update_cart_item_quantity(
    item_id: uuid.UUID,
    item_data: CartItemUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a vendor to update the quantity of an item in their cart."""
    vendor_id_str = current_user.get("user_id")

    # Get the item and verify it belongs to the current user
    query = select(CartItemModel).where(
        CartItemModel.id == item_id,
        CartItemModel.vendor_id == uuid.UUID(vendor_id_str)
    )
    result = await db.execute(query)
    item_to_update = result.scalar_one_or_none()

    if not item_to_update:
        raise HTTPException(status_code=404, detail="Cart item not found.")
    
    if item_to_update.is_finalized:
        raise HTTPException(status_code=400, detail="Cannot update items in a finalized order.")

    # Update the quantity and commit
    item_to_update.quantity = item_data.quantity
    await db.commit()
    await db.refresh(item_to_update)

    return item_to_update

@cart_router.delete(
    "/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission(resource="cart", permission="delete"))]
)
async def remove_item_from_cart(
    item_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a vendor to remove an item from their cart."""
    vendor_id_str = current_user.get("user_id")

    # Get the item and verify ownership before deleting
    query = select(CartItemModel).where(
        CartItemModel.id == item_id,
        CartItemModel.vendor_id == uuid.UUID(vendor_id_str)
    )
    result = await db.execute(query)
    item_to_delete = result.scalar_one_or_none()

    if item_to_delete:
        if item_to_delete.is_finalized:
            raise HTTPException(status_code=400, detail="Cannot delete items from a finalized order.")
        
        await db.delete(item_to_delete)
        await db.commit()

    # Return 204 No Content, indicating success
    return