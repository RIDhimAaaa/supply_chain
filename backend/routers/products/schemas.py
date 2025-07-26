from pydantic import BaseModel, Field
import uuid

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