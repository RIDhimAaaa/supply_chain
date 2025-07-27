from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
import uuid
from typing import List
from collections import defaultdict

from dependencies.rbac import require_permission
from dependencies.get_current_user import get_current_user
from config import get_db
from models import Product as ProductModel, Deal, CartItem
from .schemas import ProductCreate, Product as ProductSchema, ProductUpdate, ProductDetail, ProductDashboardView, SupplierOrderItem, SupplierOrderSummary

products_router = APIRouter(prefix="/products", tags=["Products"])

# --- Endpoint for All Users (Mainly Vendors) to Browse Products ---
@products_router.get(
    "/",
    response_model=List[ProductSchema],
    dependencies=[Depends(require_permission(resource="products", permission="read"))]
)
async def list_all_products(db: AsyncSession = Depends(get_db)):
    """
    Endpoint for vendors to browse all available products from all suppliers.
    """
    query = select(ProductModel).where(ProductModel.is_available == True)
    result = await db.execute(query)
    products = result.scalars().all()
    return products

# --- Endpoint for All Users (Mainly Vendors) to Search Products ---
@products_router.get(
    "/search",
    response_model=List[ProductSchema],
    dependencies=[Depends(require_permission(resource="products", permission="read"))]
)
async def search_products(
    query_str: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for vendors to search for products by name.
    Example: /products/search?query_str=onion
    """
    # Using 'ilike' for case-insensitive search
    search_query = select(ProductModel).where(
        ProductModel.name.ilike(f"%{query_str}%"),
        ProductModel.is_available == True
    )
    result = await db.execute(search_query)
    products = result.scalars().all()
    return products

# --- Endpoints for Suppliers to Manage Their Own Products ---

@products_router.post(
    "/", 
    response_model=ProductSchema,
    dependencies=[Depends(require_permission(resource="products", permission="write"))]
)
async def create_product(
    product_data: ProductCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a logged-in supplier to create a new product."""
    supplier_id_str = current_user.get("user_id")
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
    query = select(ProductModel).where(ProductModel.id == product_id)
    product_to_update = (await db.execute(query)).scalar_one_or_none()

    if not product_to_update:
        raise HTTPException(status_code=404, detail="Product not found.")
    if product_to_update.supplier_id != uuid.UUID(supplier_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this product.")

    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product_to_update, key, value)
    
    await db.commit()
    await db.refresh(product_to_update)
    return product_to_update

@products_router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission(resource="products", permission="delete"))]
)
async def delete_product(
    product_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a supplier to delete one of their products."""
    supplier_id = current_user.get("user_id")
    query = select(ProductModel).where(ProductModel.id == product_id)
    product_to_delete = (await db.execute(query)).scalar_one_or_none()

    if product_to_delete:
        if product_to_delete.supplier_id != uuid.UUID(supplier_id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this product.")
        await db.delete(product_to_delete)
        await db.commit()


@products_router.get(
    "/{product_id}",
    response_model=ProductDetail,
    dependencies=[Depends(require_permission(resource="products", permission="read"))]
)
async def get_product_details(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for a vendor to get the detailed view of a single product,
    including all of its available tiered deals.
    """
    query = select(ProductModel).options(
        selectinload(ProductModel.deals) # Eagerly load the related deals
    ).where(
        ProductModel.id == product_id,
        ProductModel.is_available == True
    )
    
    result = await db.execute(query)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    return product


@products_router.get(
    "/me/dashboard",
    response_model=List[ProductDashboardView],
    dependencies=[Depends(require_permission(resource="products", permission="read"))]
)
async def get_supplier_dashboard(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for a supplier to see the real-time status of their products,
    including current collective demand and deal progress.
    """
    supplier_id = uuid.UUID(current_user.get("user_id"))

    # 1. Get all of the supplier's products with their deals
    products_query = select(ProductModel).options(
        selectinload(ProductModel.deals)
    ).where(ProductModel.supplier_id == supplier_id)
    
    my_products = (await db.execute(products_query)).scalars().all()
    product_ids = [p.id for p in my_products]

    # 2. Calculate the current, non-finalized demand for all these products
    demand_query = select(CartItem.product_id, CartItem.quantity).where(
        CartItem.product_id.in_(product_ids),
        CartItem.is_finalized == False
    )
    demand_results = (await db.execute(demand_query)).all()

    # Use a defaultdict to easily sum up the demand
    current_demand = defaultdict(int)
    for product_id, quantity in demand_results:
        current_demand[product_id] += quantity

    # 3. Build the detailed response for the dashboard
    dashboard_data = []
    for product in my_products:
        demand = current_demand[product.id]
        
        deals_status = []
        if product.deals:
            for deal in sorted(product.deals, key=lambda d: d.threshold):
                deals_status.append({
                    "threshold": deal.threshold,
                    "discount": deal.discount,
                    "is_unlocked": demand >= deal.threshold
                })

        dashboard_data.append({
            "id": product.id,
            "name": product.name,
            "unit": product.unit,
            "current_demand": demand,
            "deals_status": deals_status
        })

    return dashboard_data


@products_router.get(
    "/me/orders/pending",
    response_model=List[SupplierOrderSummary],
    dependencies=[Depends(require_permission(resource="products", permission="read"))]
)
async def get_supplier_pending_orders(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for a supplier to see summary of all finalized orders they need to fulfill.
    Shows aggregated quantities by product.
    """
    supplier_id = uuid.UUID(current_user.get("user_id"))

    # Get all finalized cart items for this supplier's products
    query = select(CartItem).options(
        selectinload(CartItem.product)
    ).join(
        ProductModel, CartItem.product_id == ProductModel.id
    ).where(
        ProductModel.supplier_id == supplier_id,
        CartItem.is_finalized == True
    )

    result = await db.execute(query)
    cart_items = result.scalars().all()

    # Aggregate the data manually
    product_summaries = defaultdict(lambda: {
        'product_id': None,
        'product_name': '',
        'unit': '',
        'total_quantity': 0,
        'total_orders': 0,
        'estimated_revenue': 0.0
    })

    for item in cart_items:
        product_id = item.product_id
        if product_summaries[product_id]['product_id'] is None:
            product_summaries[product_id]['product_id'] = product_id
            product_summaries[product_id]['product_name'] = item.product.name
            product_summaries[product_id]['unit'] = item.product.unit
        
        product_summaries[product_id]['total_quantity'] += item.quantity
        product_summaries[product_id]['total_orders'] += 1
        product_summaries[product_id]['estimated_revenue'] += float(item.final_price or 0) * item.quantity

    return list(product_summaries.values())


@products_router.get(
    "/me/orders/details",
    response_model=List[SupplierOrderItem],
    dependencies=[Depends(require_permission(resource="products", permission="read"))]
)
async def get_supplier_order_details(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for a supplier to see detailed list of all individual orders they need to fulfill.
    Shows each cart item with vendor information.
    """
    supplier_id = uuid.UUID(current_user.get("user_id"))

    # Get all finalized cart items for this supplier's products with vendor details
    query = select(CartItem).options(
        selectinload(CartItem.product),
        selectinload(CartItem.vendor)
    ).join(
        ProductModel, CartItem.product_id == ProductModel.id
    ).where(
        ProductModel.supplier_id == supplier_id,
        CartItem.is_finalized == True
    ).order_by(CartItem.finalized_at.desc())

    result = await db.execute(query)
    cart_items = result.scalars().all()

    order_details = []
    for item in cart_items:
        order_details.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name,
            "quantity": item.quantity,
            "final_price": float(item.final_price) if item.final_price else 0.0,
            "vendor_name": item.vendor.full_name if item.vendor else "Unknown",
            "vendor_phone": item.vendor.phone if item.vendor else None,
            "finalized_at": item.finalized_at.isoformat() if item.finalized_at else None
        })

    return order_details