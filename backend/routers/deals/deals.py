from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from dependencies.rbac import require_permission
from dependencies.get_current_user import get_current_user
from config import get_db
from models import Deal as DealModel, Product as ProductModel
from .schemas import DealCreate, Deal as DealSchema
from .schemas import DealUpdate
from sqlalchemy import select

deals_router = APIRouter(prefix="/deals", tags=["Deals"])

@deals_router.post(
    "/products/{product_id}", # The URL is descriptive: "Create a deal for a specific product"
    response_model=DealSchema,
    dependencies=[Depends(require_permission(resource="deals", permission="write"))]
)
async def create_deal_for_product(
    product_id: uuid.UUID,
    deal_data: DealCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for a logged-in supplier to create a new deal for one of their products.
    """
    supplier_id = current_user.get("user_id")

    # 1. VERIFY OWNERSHIP: Before creating a deal, we MUST check if the supplier owns the product.
    query = select(ProductModel).where(
        ProductModel.id == product_id,
        ProductModel.supplier_id == uuid.UUID(supplier_id)
    )
    result = await db.execute(query)
    product = result.scalar_one_or_none()

    if not product:
        # If the product doesn't exist OR the supplier doesn't own it, deny the request.
        raise HTTPException(status_code=404, detail="Product not found or you do not own this product.")

    # 2. CREATE THE DEAL: If verification passes, create the new deal object.
    new_deal = DealModel(
        id=uuid.uuid4(),
        product_id=product_id,
        threshold=deal_data.threshold,
        discount=deal_data.discount
    )

    # 3. SAVE TO DATABASE: Add the new deal and commit the changes.
    db.add(new_deal)
    await db.commit()
    await db.refresh(new_deal)

    return new_deal

@deals_router.put(
    "/{deal_id}",
    response_model=DealSchema,
    dependencies=[Depends(require_permission(resource="deals", permission="write"))]
)
async def update_deal(
    deal_id: uuid.UUID,
    deal_data: DealUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a supplier to update one of their deals."""
    supplier_id = current_user.get("user_id")

    # To verify ownership, we must join through the product table
    query = select(DealModel).join(ProductModel).where(
        DealModel.id == deal_id,
        ProductModel.supplier_id == uuid.UUID(supplier_id)
    )
    result = await db.execute(query)
    deal_to_update = result.scalar_one_or_none()

    if not deal_to_update:
        raise HTTPException(status_code=404, detail="Deal not found or you do not have permission to edit it.")

    # Update the deal with the new data
    update_data = deal_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(deal_to_update, key, value)
    
    await db.commit()
    await db.refresh(deal_to_update)
    
    return deal_to_update

@deals_router.delete(
    "/{deal_id}",
    status_code=204,
    dependencies=[Depends(require_permission(resource="deals", permission="delete"))]
)
async def delete_deal(
    deal_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a supplier to delete one of their deals."""
    supplier_id = current_user.get("user_id")

    # Verify ownership before deleting
    query = select(DealModel).join(ProductModel).where(
        DealModel.id == deal_id,
        ProductModel.supplier_id == uuid.UUID(supplier_id)
    )
    result = await db.execute(query)
    deal_to_delete = result.scalar_one_or_none()

    if deal_to_delete:
        await db.delete(deal_to_delete)
        await db.commit()

    # Return 204 No Content whether the deal was found or not
    return