from pydantic import BaseModel, Field
import uuid

class DealBase(BaseModel):
    # This is the "form" the supplier fills out.
    threshold: int = Field(..., gt=0, description="The quantity needed to unlock this deal.")
    discount: float = Field(..., gt=0, lt=1, description="The discount percentage, e.g., 0.15 for 15% off.")

class DealCreate(DealBase):
    pass # For creation, this is all we need from the supplier.

class Deal(DealBase):
    # This is the "receipt" we send back, including the IDs.
    id: uuid.UUID
    product_id: uuid.UUID
    is_active: bool

    class Config:
        from_attributes = True # Pydantic v2's way of saying "orm_mode = True"


class DealUpdate(BaseModel):
    threshold: int | None = Field(None, gt=0, description="The quantity needed to unlock this deal.")
    discount: float | None = Field(None, gt=0, lt=1, description="The discount percentage, e.g., 0.15 for 15% off.")
    is_active: bool | None = None