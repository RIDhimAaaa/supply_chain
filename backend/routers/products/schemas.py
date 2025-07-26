from pydantic import BaseModel
import uuid

class ProductBase(BaseModel):
    name: str
    description: str | None = None
    unit: str
    base_price: float
    img_emoji: str | None = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: uuid.UUID
    supplier_id: uuid.UUID
    is_available: bool

    class Config:
        orm_mode = True # This tells Pydantic to read the data from an ORM model