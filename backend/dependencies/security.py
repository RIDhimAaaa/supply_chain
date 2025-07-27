from fastapi import Request, HTTPException, Security
from fastapi.security import APIKeyHeader
import os

# This tells FastAPI to look for a custom header called 'x-internal-secret'
API_KEY_HEADER = APIKeyHeader(name="x-internal-secret")

# This is the secret value. We will store it in our environment variables.
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY")

async def verify_internal_secret(api_key: str = Security(API_KEY_HEADER)):
    """
    This dependency checks if the incoming request has the correct secret key.
    """
    if not INTERNAL_API_KEY:
        raise HTTPException(status_code=500, detail="Internal API key not configured on server.")
        
    if api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid internal API key.")