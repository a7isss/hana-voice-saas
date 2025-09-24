from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List, Optional
import json
import logging
from ..core.auth import auth_service, TokenData
from ..storage.supabase_client import supabase_client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint for load balancers"""
    try:
        # Check database connection
        db_healthy = supabase_client.health_check()
        
        return {
            "status": "healthy" if db_healthy else "degraded",
            "service": "hana-voice-api",
            "database": "connected" if db_healthy else "disconnected",
            "timestamp": "2025-09-23T21:25:00Z"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )

# Authentication endpoints
@router.post("/auth/login")
async def login(email: str, password: str):
    """User login endpoint"""
    try:
        auth_response = auth_service.login(email, password)
        if not auth_response:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return auth_response
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.get("/auth/me")
async def get_current_user(current_user: TokenData = Depends(auth_service.get_current_active_user)):
    """Get current user information"""
    try:
        profile = supabase_client.get_profile_by_email(current_user.email)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return {
            "user_id": current_user.user_id,
            "email": current_user.email,
            "role": current_user.role,
            "profile": profile
        }
    except Exception as e:
        logger.error(f"Get user error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )

# Institution management
@router.get("/institutions")
async def get_institutions(current_user: TokenData = Depends(auth_service.get_current_active_user)):
    """Get user's institutions"""
    try:
        institutions = supabase_client.get_institutions_by_user(current_user.user_id)
        return {"institutions": institutions or []}
    except Exception as e:
        logger.error(f"Get institutions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get institutions"
        )

@router.post("/institutions")
async def create_institution(
    institution_data: dict,
    current_user: TokenData = Depends(auth_service.get_current_active_user)
):
    """Create a new institution"""
    try:
        # Add user ID to institution data
        institution_data["saas_user_id"] = current_user.user_id
        
        institution = supabase_client.create_institution(institution_data)
        if not institution:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create institution"
            )
        
        return {"institution": institution}
    except Exception as e:
        logger.error(f"Create institution error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create institution"
        )

# Customer management
@router.get("/institutions/{client_id}/customers")
async def get_customers(
    client_id: str,
    current_user: TokenData = Depends(auth_service.get_current_active_user)
):
    """Get customers for an institution"""
    try:
        # Verify user has access to this institution
        institutions = supabase_client.get_institutions_by_user(current_user.user_id)
        institution_ids = [inst["client_id"] for inst in (institutions or [])]
        
        if client_id not in institution_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to institution"
            )
        
        customers = supabase_client.get_customers_by_client(client_id)
        return {"customers": customers or []}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get customers error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get customers"
        )

@router.post("/institutions/{client_id}/customers")
async def create_customer(
    client_id: str,
    customer_data: dict,
    current_user: TokenData = Depends(auth_service.get_current_active_user)
):
    """Create a new customer"""
    try:
        # Verify user has access to this institution
        institutions = supabase_client.get_institutions_by_user(current_user.user_id)
        institution_ids = [inst["client_id"] for inst in (institutions or [])]
        
        if client_id not in institution_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to institution"
            )
        
        # Add client_id to customer data
        customer_data["client_id"] = client_id
        
        customer = supabase_client.create_customer(customer_data)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create customer"
            )
        
        return {"customer": customer}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create customer error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create customer"
        )

# Call management
@router.get("/institutions/{client_id}/call-logs")
async def get_call_logs(
    client_id: str,
    current_user: TokenData = Depends(auth_service.get_current_active_user)
):
    """Get call logs for an institution"""
    try:
        # Verify user has access to this institution
        institutions = supabase_client.get_institutions_by_user(current_user.user_id)
        institution_ids = [inst["client_id"] for inst in (institutions or [])]
        
        if client_id not in institution_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to institution"
            )
        
        # This would typically call the voice service for real data
        # For now, return mock data
        mock_call_logs = [
            {
                "id": 1,
                "conversation_id": "conv_001",
                "client_id": client_id,
                "patient_id": "pat_001",
                "department": "cardiology",
                "phone_number": "+966501234567",
                "status": "completed",
                "call_duration": 120,
                "timestamp": "2025-09-23T10:30:00Z"
            }
        ]
        
        return {"call_logs": mock_call_logs}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get call logs error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get call logs"
        )

@router.post("/institutions/{client_id}/start-call")
async def start_call(
    client_id: str,
    call_data: dict,
    current_user: TokenData = Depends(auth_service.get_current_active_user)
):
    """Start a new voice call"""
    try:
        # Verify user has access and has credits
        profile = supabase_client.get_profile_by_email(current_user.email)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        total_credits = profile.get("call_credits_free", 0) + profile.get("call_credits_paid", 0)
        if total_credits <= 0:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient call credits"
            )
        
        # Create call log entry
        call_log_data = {
            "conversation_id": call_data.get("conversation_id"),
            "client_id": client_id,
            "patient_id": call_data.get("patient_id"),
            "department": call_data.get("department"),
            "phone_number": call_data.get("phone_number"),
            "status": "initiated"
        }
        
        call_log = supabase_client.create_call_log(call_log_data)
        
        # Deduct credit (mock implementation)
        # In production, this would be done after successful call completion
        
        return {
            "call_log": call_log,
            "message": "Call initiated successfully",
            "remaining_credits": total_credits - 1
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Start call error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start call"
        )

# Analytics and reporting
@router.get("/institutions/{client_id}/analytics")
async def get_analytics(
    client_id: str,
    current_user: TokenData = Depends(auth_service.get_current_active_user)
):
    """Get analytics for an institution"""
    try:
        # Verify user has access to this institution
        institutions = supabase_client.get_institutions_by_user(current_user.user_id)
        institution_ids = [inst["client_id"] for inst in (institutions or [])]
        
        if client_id not in institution_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to institution"
            )
        
        # Mock analytics data - in production, this would aggregate from database
        analytics = {
            "total_customers": 150,
            "total_calls": 89,
            "completed_calls": 67,
            "failed_calls": 22,
            "success_rate": 75.3,
            "total_responses": 134,
            "yes_responses": 89,
            "no_responses": 32,
            "uncertain_responses": 13,
            "departments": {
                "cardiology": 45,
                "dermatology": 23,
                "emergency": 12,
                "general_practitioner": 70
            }
        }
        
        return {"analytics": analytics}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get analytics error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analytics"
        )

# Voice processing endpoints (would proxy to voice service)
@router.post("/voice/generate-speech")
async def generate_speech(
    text: str,
    voice: str = "nova",
    language: str = "ar",
    current_user: TokenData = Depends(auth_service.get_current_active_user)
):
    """Generate speech from text"""
    try:
        # Mock response - in production, this would call the voice service
        mock_audio_data = {
            "text_hash": "mock_hash_123",
            "audio_url": "data:audio/mpeg;base64,mock_base64_audio_data",
            "voice_model": voice,
            "language": language,
            "duration": 5.2
        }
        
        return {"audio": mock_audio_data}
    except Exception as e:
        logger.error(f"Generate speech error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate speech"
        )

@router.post("/voice/transcribe")
async def transcribe_speech(
    audio_file: UploadFile = File(...),
    language: str = "ar",
    current_user: TokenData = Depends(auth_service.get_current_active_user)
):
    """Transcribe speech to text"""
    try:
        # Mock response - in production, this would call the voice service
        mock_transcription = {
            "text": "نعم، أشعر بتحسن اليوم",
            "language": language,
            "confidence": 0.92,
            "duration": 3.5
        }
        
        return {"transcription": mock_transcription}
    except Exception as e:
        logger.error(f"Transcribe speech error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to transcribe speech"
        )

# Data export endpoints (would proxy to data service)
@router.get("/export/survey-responses")
async def export_survey_responses(
    client_id: str,
    start_date: str = None,
    end_date: str = None,
    language: str = "ar",
    current_user: TokenData = Depends(auth_service.get_current_active_user)
):
    """Export survey responses to Excel"""
    try:
        # Verify user has access to this institution
        institutions = supabase_client.get_institutions_by_user(current_user.user_id)
        institution_ids = [inst["client_id"] for inst in (institutions or [])]
        
        if client_id not in institution_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to institution"
            )
        
        # Mock response - in production, this would call the data service
        # For now, return a success message
        return {
            "message": "Export initiated",
            "export_id": "exp_001",
            "status": "processing",
            "estimated_completion": "2025-09-23T21:30:00Z"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export survey responses error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export survey responses"
        )

# Dashboard endpoints
@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: TokenData = Depends(auth_service.get_current_active_user)
):
    """Get dashboard statistics"""
    try:
        stats = supabase_client.get_dashboard_stats(current_user.user_id)
        if not stats:
            # Return mock data if no real data available
            stats = {
                "profile_id": current_user.user_id,
                "email": current_user.email,
                "full_name": "Mock User",
                "role": current_user.role,
                "call_credits_free": 10,
                "call_credits_paid": 5,
                "total_calls_made": 89,
                "total_successful_calls": 67,
                "institution_count": 3,
                "customer_count": 150,
                "completed_calls": 67,
                "failed_calls": 22
            }
        
        return {"stats": stats}
    except Exception as e:
        logger.error(f"Get dashboard stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get dashboard statistics"
        )
