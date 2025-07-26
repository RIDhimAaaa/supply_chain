from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import JWT_SECRET_KEY, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
import jwt
import os
import logging
from typing import Dict, Any, List, Callable

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        logger.info(f"Received token: {token[:20]}...")  # Log first 20 chars for debugging
        
        # Get JWT secret from Supabase anon key
        jwt_secret = JWT_SECRET_KEY
        
        # Decode the JWT token
        payload = jwt.decode(
            token, 
            jwt_secret, 
            algorithms=["HS256"],
            options={"verify_signature": True, "verify_exp": True, "verify_aud": False}
        )
        
        # Extract user information from payload
        user_id = payload.get("sub")
        email = payload.get("email")
        user_metadata = payload.get("user_metadata", {})
        jwt_role = user_metadata.get("role", "user")  # role from JWT as fallback

        logger.info(f"Decoded user: {user_id}, email: {email}, JWT role: {jwt_role}")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check database for current role (this ensures we get the most up-to-date role)
        current_role = jwt_role  # fallback to JWT role
        try:
            from models import Profile, Role
            result = await db.execute(
                select(Profile, Role.name.label('role_name'))
                .join(Role, Profile.role_id == Role.id, isouter=True)
                .where(Profile.id == user_id)
            )
            profile_with_role = result.first()
            
            if profile_with_role and profile_with_role.role_name:
                current_role = profile_with_role.role_name
                logger.info(f"Updated role from database: {current_role}")
            else:
                logger.info(f"No role found in database, using JWT role: {jwt_role}")
                
        except Exception as e:
            logger.warning(f"Could not fetch role from database: {e}, using JWT role: {jwt_role}")

        # Create a user-like object with the decoded information
        current_user = {
            "user_id": user_id,
            "email": email, 
            "role": current_role,
            "payload": payload
        }

        logger.info(f"User {user_id} authenticated with role: {current_role}")
        
        # Set current user in request state for RBAC
        request.state.current_user = current_user
        
        return current_user
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )



