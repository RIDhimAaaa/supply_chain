from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from typing import List
import os

# Import all the necessary tools
from dependencies.rbac import require_permission
from dependencies.get_current_user import get_current_user
from config import get_db, supabase_admin, supabase
from models import Application as ApplicationModel, Role, Profile
from .schemas import ApplicationCreate, Application as ApplicationSchema, ApplicationAdminUpdate, DocumentUploadResponse

applications_router = APIRouter(prefix="/applications", tags=["Applications"])

@applications_router.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_application_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Endpoint for users to upload supporting documents for their role application.
    Returns the URL of the uploaded document to be used in the application submission.
    """
    user_id = current_user.get("user_id")
    
    # Validate file type (allow common document formats)
    allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'}
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"File type {file_extension} not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Validate file size (limit to 5MB)
    max_size = 5 * 1024 * 1024  # 5MB in bytes
    file_content = await file.read()
    
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File size too large. Maximum size is 5MB."
        )
    
    try:
        # Generate unique filename to avoid conflicts
        unique_filename = f"{user_id}_{uuid.uuid4()}{file_extension}"
        
        # Upload to Supabase Storage
        bucket_id = os.getenv('bucket_id', 'application-proof')
        
        response = supabase.storage.from_(bucket_id).upload(
            path=f"documents/{unique_filename}",
            file=file_content,
            file_options={"content-type": file.content_type}
        )
        
        # Check if upload was successful - Supabase returns an object with path if successful
        if hasattr(response, 'path') and response.path:
            # Get the public URL
            public_url = supabase.storage.from_(bucket_id).get_public_url(f"documents/{unique_filename}")
            
            return {
                "message": "Document uploaded successfully",
                "document_url": public_url,
                "filename": unique_filename
            }
        else:
            # Handle upload error
            error_message = getattr(response, 'message', 'Unknown upload error')
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload document: {error_message}"
            )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading document: {str(e)}"
        )
    finally:
        # Reset file position for potential reuse
        await file.seek(0)

@applications_router.post("/", response_model=ApplicationSchema, status_code=status.HTTP_201_CREATED)
async def submit_application(
    application_data: ApplicationCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for a user to apply for a new role (e.g., supplier, agent).
    
    **Workflow:**
    1. First upload a supporting document using `/applications/upload-document`
    2. Use the returned document_url in this endpoint to submit the application
    3. Admin will review and approve/reject the application
    4. Upon approval, user's role will be updated automatically
    """
    user_id_str = current_user.get("user_id")

    # Find the ID of the role they are requesting
    role_query = select(Role).where(Role.name == application_data.requested_role_name)
    role_result = await db.execute(role_query)
    requested_role = role_result.scalar_one_or_none()
    if not requested_role:
        raise HTTPException(status_code=404, detail=f"Role '{application_data.requested_role_name}' not found.")

    # Create the new application record
    new_application = ApplicationModel(
        id=uuid.uuid4(),
        user_id=uuid.UUID(user_id_str),
        requested_role_id=requested_role.id,
        document_url=application_data.document_url
    )

    db.add(new_application)
    await db.commit()
    await db.refresh(new_application)

    return new_application


@applications_router.get("/me", response_model=List[ApplicationSchema])
async def get_my_applications(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a user to see the status of their own applications."""
    user_id_str = current_user.get("user_id")
    
    query = select(ApplicationModel).where(ApplicationModel.user_id == uuid.UUID(user_id_str))
    result = await db.execute(query)
    applications = result.scalars().all()
    
    return applications

@applications_router.get(
    "/",
    response_model=List[ApplicationSchema],
    dependencies=[Depends(require_permission(resource="applications", permission="read"))]
)
async def list_all_applications(
    status: str | None = None, # Optional query parameter to filter by status
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for an admin to fetch all applications.
    Can be filtered by status, e.g., /applications?status=pending
    """
    query = select(ApplicationModel)
    
    if status:
        query = query.where(ApplicationModel.status == status)
        
    result = await db.execute(query)
    applications = result.scalars().all()
    
    return applications


@applications_router.put(
    "/{application_id}",
    response_model=ApplicationSchema,
    dependencies=[Depends(require_permission(resource="applications", permission="write"))]
)
async def review_application(
    application_id: uuid.UUID,
    update_data: ApplicationAdminUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for an admin to approve or reject an application."""
    # Get the application from the database
    app_query = select(ApplicationModel).where(ApplicationModel.id == application_id)
    app_result = await db.execute(app_query)
    application = app_result.scalar_one_or_none()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    
    if application.status != 'pending':
        raise HTTPException(status_code=400, detail="This application has already been reviewed.")

    # Update the application status and notes
    application.status = update_data.status
    application.notes = update_data.notes

    # If approved, upgrade the user's role
    if update_data.status == 'approved':
        # 1. Update the role_id in the public.profiles table
        profile_query = select(Profile).where(Profile.id == application.user_id)
        profile_result = await db.execute(profile_query)
        user_profile = profile_result.scalar_one()
        user_profile.role_id = application.requested_role_id
        user_profile.is_approved = True

        # 2. Update the role in the user's JWT metadata
        role_query = select(Role).where(Role.id == application.requested_role_id)
        role_result = await db.execute(role_query)
        new_role = role_result.scalar_one()
        
        try:
            supabase_admin.auth.admin.update_user_by_id(
                str(application.user_id), {"user_metadata": {"role": new_role.name}}
            )
        except Exception as e:
            # If this fails, we should ideally roll back the DB transaction
            raise HTTPException(status_code=500, detail=f"Failed to update user auth role: {e}")

    await db.commit()
    await db.refresh(application)

    return application