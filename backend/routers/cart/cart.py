from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid
from typing import List

from dependencies.rbac import require_permission
from dependencies.get_current_user import get_current_user
from config import get_db
from models import CartItem as CartItemModel
# Import the new, improved schemas
from .schemas import CartItemCreate, CartView, CartItem as CartItemSchema, CartItemUpdate

cart_router = APIRouter(prefix="/cart", tags=["Shopping Cart"])

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
    """Endpoint for a vendor to add a product to their cart. If the item already exists, its quantity is increased."""
    vendor_id = uuid.UUID(current_user.get("user_id"))

    query = select(CartItemModel).where(
        CartItemModel.vendor_id == vendor_id,
        CartItemModel.product_id == item_data.product_id,
        CartItemModel.is_finalized == False
    )
    existing_item = (await db.execute(query)).scalar_one_or_none()

    if existing_item:
        existing_item.quantity += item_data.quantity
        await db.commit()
        # Refresh the relationship to include product details in the response
        await db.refresh(existing_item, attribute_names=['product'])
        return existing_item

    new_cart_item = CartItemModel(
        id=uuid.uuid4(),
        vendor_id=vendor_id,
        product_id=item_data.product_id,
        quantity=item_data.quantity
    )
    db.add(new_cart_item)
    await db.commit()
    await db.refresh(new_cart_item, attribute_names=['product'])
    
    return new_cart_item

@cart_router.get(
    "/me",
    response_model=CartView,
    dependencies=[Depends(require_permission(resource="cart", permission="read"))]
)
async def get_my_cart(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint to view the contents of the current vendor's active cart.
    IMPROVEMENT: Now eagerly loads product details and calculates the estimated total price.
    """
    vendor_id = uuid.UUID(current_user.get("user_id"))

    query = select(CartItemModel).options(
        selectinload(CartItemModel.product) # This is the key improvement
    ).where(
        CartItemModel.vendor_id == vendor_id,
        CartItemModel.is_finalized == False
    )
    
    cart_items = (await db.execute(query)).scalars().all()
    
    # --- ADDED: Calculate the estimated total price based on base prices ---
    estimated_total = 0.0
    for item in cart_items:
        if item.product and item.product.base_price:
            estimated_total += item.quantity * float(item.product.base_price)

    return {
        "items": cart_items,
        "total_items": len(cart_items),
        "estimated_total": estimated_total
    }

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
    vendor_id = uuid.UUID(current_user.get("user_id"))

    query = select(CartItemModel).where(
        CartItemModel.id == item_id,
        CartItemModel.vendor_id == vendor_id
    )
    item_to_update = (await db.execute(query)).scalar_one_or_none()

    if not item_to_update:
        raise HTTPException(status_code=404, detail="Cart item not found.")
    
    if item_to_update.is_finalized:
        raise HTTPException(status_code=400, detail="Cannot update items in a finalized order.")

    item_to_update.quantity = item_data.quantity
    await db.commit()
    await db.refresh(item_to_update, attribute_names=['product'])

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
    vendor_id = uuid.UUID(current_user.get("user_id"))

    query = select(CartItemModel).where(
        CartItemModel.id == item_id,
        CartItemModel.vendor_id == vendor_id
    )
    item_to_delete = (await db.execute(query)).scalar_one_or_none()

    if item_to_delete:
        if item_to_delete.is_finalized:
            raise HTTPException(status_code=400, detail="Cannot delete items from a finalized order.")
        
        await db.delete(item_to_delete)
        await db.commit()

    return
