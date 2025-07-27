from pydantic import BaseModel

class OrderStatus(BaseModel):
    status: str
    details: str | None = None