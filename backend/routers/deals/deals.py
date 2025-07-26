from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from dependencies.rbac import require_permission
from dependencies.get_current_user import get_current_user
from config import get_db
from models import Deal as DealModel, Product as ProductModel
from .schemas import DealCreate, Deal as DealSchema
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