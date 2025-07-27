from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

class CartItemUpdate(BaseModel):
    """Schema for updating the quantity of an item in the cart."""
    quantity: int = Field(..., gt=0, description="New quantity, must be greater than 0.")

class CartItemCreate(BaseModel):
    """Schema for adding an item to the cart."""
    product_id: uuid.UUID = Field(..., description="ID of the product to add to cart")
    quantity: int = Field(..., gt=0, description="Quantity to add, must be greater than 0.")

class CartItemSchema(BaseModel):
    """Schema for a cart item response."""
    id: uuid.UUID
    vendor_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    is_finalized: bool
    final_price: Optional[float] = None
    added_at: datetime
    finalized_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CartResponse(BaseModel):
    """Schema for cart response with all items."""
    items: List[CartItemSchema]
    total_items: int = Field(..., description="Total number of items in cart")
    estimated_total: Optional[float] = Field(None, description="Estimated total price")