from pydantic import BaseModel, Field
import uuid
from datetime import datetime
from typing import List

# We need to import the Product schema to nest it in the cart view
from ..products.schemas import Product as ProductSchema

class CartItemBase(BaseModel):
    quantity: int = Field(..., gt=0, description="Quantity must be greater than 0.")

class CartItemCreate(CartItemBase):
    """Schema for a vendor adding an item to their cart."""
    product_id: uuid.UUID

class CartItemUpdate(CartItemBase):
    """Schema for updating the quantity of an item."""
    pass

class CartItem(BaseModel):
    """
    Schema for viewing a single item in the cart.
    IMPROVEMENT: It now includes the full product details.
    """
    id: uuid.UUID
    quantity: int
    product: ProductSchema # Nests the full product details

    class Config:
        from_attributes = True

class CartView(BaseModel):
    """The full view of the user's cart."""
    items: List[CartItem]
    # --- ADDED ---
    total_items: int
    estimated_total: float
    """Estimated total price of all items in the cart."""