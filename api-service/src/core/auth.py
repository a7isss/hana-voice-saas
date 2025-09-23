import os
import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import logging
from ..storage.supabase_client import supabase_client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Models
class TokenData(BaseModel):
    user_id: str
    email: str
    role: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    email: str
    role: str
    expires_in: int

class JWTConfig:
    def __init__(self):
        self.secret_key = os.getenv('JWT_SECRET_KEY', 'fallback-secret-key-change-in-production')
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30

jwt_config = JWTConfig()

class AuthService:
    """Authentication service for JWT token management"""
    
    def __init__(self):
        self.supabase = supabase_client
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=jwt_config.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, jwt_config.secret_key, algorithm=jwt_config.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[TokenData]:
        """Verify JWT token and return token data"""
        try:
            payload = jwt.decode(token, jwt_config.secret_key, algorithms=[jwt_config.algorithm])
            user_id: str = payload.get("sub")
            email: str = payload.get("email")
            role: str = payload.get("role")
            
            if user_id is None or email is None:
                return None
            
            return TokenData(user_id=user_id, email=email, role=role)
        except jwt.ExpiredSignatureError:
            logger.error("Token has expired")
            return None
        except jwt.InvalidTokenError:
            logger.error("Invalid token")
            return None
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None
    
    def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """
        Authenticate user against Supabase Auth
        Note: This is a placeholder - in production, use Supabase Auth directly
        """
        try:
            # TODO: Integrate with Supabase Auth for real authentication
            # For now, we'll use a simple mock for development
            
            # Check if user exists in our profiles table
            profile = self.supabase.get_profile_by_email(email)
            if not profile:
                return None
            
            # Mock authentication - in production, verify password with Supabase Auth
            # For development, accept any password
            logger.info(f"Mock authentication for user: {email}")
            
            return {
                "user_id": profile["id"],
                "email": profile["email"],
                "role": profile["role"],
                "full_name": profile.get("full_name", ""),
                "call_credits_free": profile.get("call_credits_free", 0),
                "call_credits_paid": profile.get("call_credits_paid", 0)
            }
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return None
    
    def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
        """Get current user from JWT token"""
        token = credentials.credentials
        token_data = self.verify_token(token)
        if token_data is None:
            raise HTTPException(
                status_code=401,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token_data
    
    def get_current_active_user(self, current_user: TokenData = Depends(get_current_user)) -> TokenData:
        """Get current active user (additional checks can be added here)"""
        # TODO: Add additional checks (e.g., user status, permissions)
        return current_user
    
    def login(self, email: str, password: str) -> Optional[AuthResponse]:
        """User login with email and password"""
        user = self.authenticate_user(email, password)
        if not user:
            return None
        
        # Create access token
        access_token_expires = timedelta(minutes=jwt_config.access_token_expire_minutes)
        access_token = self.create_access_token(
            data={
                "sub": user["user_id"],
                "email": user["email"],
                "role": user["role"]
            },
            expires_delta=access_token_expires
        )
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user["user_id"],
            email=user["email"],
            role=user["role"],
            expires_in=jwt_config.access_token_expire_minutes * 60
        )

# Global auth service instance
auth_service = AuthService()

# Dependency for protected routes
def get_current_user_dependency(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    return auth_service.get_current_user(credentials)

def get_current_active_user_dependency(current_user: TokenData = Depends(get_current_user_dependency)) -> TokenData:
    return auth_service.get_current_active_user(current_user)

# Rate limiting (placeholder - implement proper rate limiting in production)
class RateLimiter:
    """Simple rate limiter - replace with proper implementation in production"""
    
    def __init__(self):
        self.requests = {}
    
    def is_rate_limited(self, identifier: str, max_requests: int = 100, window_seconds: int = 3600) -> bool:
        """Check if request is rate limited"""
        current_time = datetime.utcnow().timestamp()
        window_start = current_time - window_seconds
        
        # Clean old requests
        if identifier in self.requests:
            self.requests[identifier] = [req for req in self.requests[identifier] if req > window_start]
        else:
            self.requests[identifier] = []
        
        # Check rate limit
        if len(self.requests[identifier]) >= max_requests:
            return True
        
        # Add current request
        self.requests[identifier].append(current_time)
        return False

rate_limiter = RateLimiter()

def rate_limit_dependency(identifier: str) -> bool:
    """Dependency for rate limiting"""
    return rate_limiter.is_rate_limited(identifier)
