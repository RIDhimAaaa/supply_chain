from pydantic import BaseModel, Field
import uuid
from ..deals.schemas import Deal as DealSchema 
from typing import List

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=1000)
    unit: str = Field(..., min_length=1, max_length=50)
    base_price: float = Field(..., gt=0, description="Price must be greater than 0")
    img_emoji: str | None = Field(None, max_length=10)

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: uuid.UUID
    supplier_id: uuid.UUID
    is_available: bool

    class Config:
        from_attributes = True  # Updated for Pydantic v2


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    unit: str | None = None
    base_price: float | None = None
    img_emoji: str | None = None
    is_available: bool | None = None


class ProductDetail(Product):
    """Extends the Product schema to include its list of deals."""
    deals: List[DealSchema] = []

class DealStatus(BaseModel):
    """Represents the status of a single deal tier."""
    threshold: int
    discount: float
    is_unlocked: bool

class ProductDashboardView(BaseModel):
    """Represents the dashboard view for a single product."""
    id: uuid.UUID
    name: str
    unit: str
    current_demand: int
    deals_status: List[DealStatus] = []

    class Config:
        from_attributes = True