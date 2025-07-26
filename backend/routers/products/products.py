

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from dependencies.rbac import require_permission
from dependencies.get_current_user import get_current_user
from config import get_db
from models import Product as ProductModel
from .schemas import ProductCreate, Product as ProductSchema
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