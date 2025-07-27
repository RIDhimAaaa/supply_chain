from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from dependencies.rbac import require_permission
from dependencies.get_current_user import get_current_user
from config import get_db
from models import Product as ProductModel
from .schemas import ProductCreate, Product as ProductSchema
from .schemas import ProductUpdate
import uuid

products_router = APIRouter(prefix="/products", tags=["Products"])

@products_router.post(
    "/", 
    response_model=ProductSchema
)
async def create_product(
    product_data: ProductCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for a logged-in supplier to create a new product.
    Check if user has supplier role manually for now.
    """
    # Manual RBAC check for now
    user_role = current_user.get('role', 'user')
    if user_role not in ['supplier', 'admin']:
        raise HTTPException(
            status_code=403, 
            detail=f"Access denied. {user_role.title()} role does not have write permission for products"
        )
        
    supplier_id_str = current_user.get("user_id")
    if not supplier_id_str:
        raise HTTPException(status_code=403, detail="Could not validate supplier identity.")

    new_product = ProductModel(
        id=uuid.uuid4(),
        supplier_id=uuid.UUID(supplier_id_str),
        **product_data.model_dump()
    )
    
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    return new_product

@products_router.get(
    "/me",
    response_model=List[ProductSchema],
    dependencies=[Depends(require_permission(resource="products", permission="read"))]
)
async def list_my_products(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a supplier to list only their own products."""
    supplier_id = current_user.get("user_id")
    query = select(ProductModel).where(ProductModel.supplier_id == uuid.UUID(supplier_id))
    result = await db.execute(query)
    my_products = result.scalars().all()
    return my_products

@products_router.put(
    "/{product_id}",
    response_model=ProductSchema,
    dependencies=[Depends(require_permission(resource="products", permission="write"))]
)
async def update_product(
    product_id: uuid.UUID,
    product_update: ProductUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a supplier to update one of their products."""
    supplier_id = current_user.get("user_id")

    # First, get the product and verify ownership
    query = select(ProductModel).where(ProductModel.id == product_id)
    result = await db.execute(query)
    product_to_update = result.scalar_one_or_none()

    if product_to_update is None:
        raise HTTPException(status_code=404, detail="Product not found.")

    if product_to_update.supplier_id != uuid.UUID(supplier_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this product.")

    # Update the product with the new data
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product_to_update, key, value)
    
    await db.commit()
    await db.refresh(product_to_update)
    
    return product_to_update

@products_router.delete(
    "/{product_id}",
    status_code=204, # No content will be returned
    dependencies=[Depends(require_permission(resource="products", permission="delete"))]
)
async def delete_product(
    product_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a supplier to delete one of their products."""
    supplier_id = current_user.get("user_id")

    # Get the product and verify ownership before deleting
    query = select(ProductModel).where(ProductModel.id == product_id)
    result = await db.execute(query)
    product_to_delete = result.scalar_one_or_none()

    if product_to_delete is None:
        # We can return 204 even if not found to prevent leaking information
        return

    if product_to_delete.supplier_id != uuid.UUID(supplier_id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this product.")

    await db.delete(product_to_delete)
    await db.commit()