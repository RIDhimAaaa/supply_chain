from pydantic import BaseModel, Field
import uuid
from datetime import datetime

class DocumentUploadResponse(BaseModel):
    """Schema for document upload response."""
    message: str
    document_url: str
    filename: str
    status_code: str

class ApplicationCreate(BaseModel):
    """Schema for a user submitting an application."""
    requested_role_name: str = Field(..., description="The name of the role being requested, e.g., 'supplier' or 'agent'.")
    document_url: str = Field(..., description="URL to the uploaded proof document in Supabase Storage. Use /upload-document endpoint first.")

class ApplicationAdminUpdate(BaseModel):
    """Schema for an admin to update the status of an application."""
    status: str = Field(..., description="The new status: 'approved' or 'rejected'.")
    notes: str | None = Field(None, description="Admin's notes, e.g., 'Business license verified.'")

class Application(BaseModel):
    """Schema for viewing an application's details."""
    id: uuid.UUID
    user_id: uuid.UUID
    requested_role_id: int
    status: str
    notes: str | None
    document_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True