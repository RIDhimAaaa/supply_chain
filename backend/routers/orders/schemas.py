from pydantic import BaseModel
import uuid
from typing import List

class OrderStatus(BaseModel):
    status: str
    details: str | None = None


class DeliveryConfirmation(BaseModel):
    """Schema for vendor to confirm delivery receipt."""
    received: bool
    rating: int | None = None  # 1-5 stars
    feedback: str | None = None
    missing_items: List[str] = []  # List of missing item descriptions
    damaged_items: List[str] = []  # List of damaged item descriptions

    class Config:
        from_attributes = True


class DeliveryFeedback(BaseModel):
    """Response schema for delivery confirmation."""
    confirmation_id: uuid.UUID
    vendor_id: uuid.UUID
    order_date: str
    received: bool
    rating: int | None = None
    feedback: str | None = None
    missing_items: List[str] = []
    damaged_items: List[str] = []
    confirmed_at: str

    class Config:
        from_attributes = True