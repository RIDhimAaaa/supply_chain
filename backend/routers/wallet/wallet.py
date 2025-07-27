from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from dependencies.get_current_user import get_current_user
from config import get_db
from models import Profile
# Import the new schemas
from .schemas import WalletStatus, RazorpayOrderCreate, RazorpayOrderResponse, RazorpayVerification

wallet_router = APIRouter(prefix="/wallet", tags=["Wallet"])

@wallet_router.get("/me", response_model=WalletStatus)
async def get_my_wallet_balance(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for a user to check their wallet balance."""
    user_id = current_user.get("user_id")
    
    profile_query = select(Profile.wallet_balance).where(Profile.id == user_id)
    balance = (await db.execute(profile_query)).scalar_one_or_none()
    
    return {"current_balance": float(balance or 0)}

# --- NEW: Endpoints for Razorpay Mock Flow ---

@wallet_router.post("/me/create-razorpay-order", response_model=RazorpayOrderResponse)
async def create_razorpay_order(
    order_data: RazorpayOrderCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Mock endpoint to create a Razorpay order.
    In a real app, this would call the Razorpay API.
    Here, we just generate a fake order ID.
    """
    # In a real app, you would use the razorpay client here.
    # razorpay_order = razorpay_client.order.create(...)
    mock_order_id = f"order_{uuid.uuid4().hex[:14]}"
    
    return {
        "razorpay_order_id": mock_order_id,
        "amount": order_data.amount
    }

@wallet_router.post("/me/verify-razorpay-payment", response_model=WalletStatus)
async def verify_razorpay_payment(
    verification_data: RazorpayVerification,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mock endpoint to verify a Razorpay payment and add funds to the wallet.
    In a real app, this would involve cryptographic signature verification.
    """
    user_id = current_user.get("user_id")

    # In a real app, you would verify the signature here.
    # For the hackathon, we trust the data and add the funds.
    
    profile_query = select(Profile).where(Profile.id == user_id)
    profile = (await db.execute(profile_query)).scalar_one()

    profile.wallet_balance = (profile.wallet_balance or 0) + verification_data.amount
    await db.commit()
    await db.refresh(profile)
    
    return {"current_balance": float(profile.wallet_balance)}