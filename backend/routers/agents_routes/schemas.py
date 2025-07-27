from pydantic import BaseModel
import uuid
from typing import List

class StopSchema(BaseModel):
    id: uuid.UUID
    stop_type: str
    status: str
    sequence_order: int
    profile_name: str
    # Location data is crucial for the agent's map view
    location: dict | None = None # e.g., {"lat": 31.30, "lng": 74.87}

    class Config:
        from_attributes = True

class RouteSchema(BaseModel):
    id: uuid.UUID
    status: str
    stops: List[StopSchema]

    class Config:
        from_attributes = True