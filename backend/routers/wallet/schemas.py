from pydantic import BaseModel, Field
import uuid

class WalletStatus(BaseModel):
    current_balance: float

# --- NEW: Schemas for Razorpay Mock Flow ---

class RazorpayOrderCreate(BaseModel):
    """Schema to request the creation of a Razorpay order."""
    amount: float = Field(..., gt=0, description="Amount to add to the wallet via Razorpay.")

class RazorpayOrderResponse(BaseModel):
    """Schema for the response after creating a Razorpay order."""
    razorpay_order_id: str
    amount: float
    currency: str = "INR"

class RazorpayVerification(BaseModel):
    """Schema for the mock verification of a Razorpay payment."""
    razorpay_order_id: str
    razorpay_payment_id: str
    amount: float