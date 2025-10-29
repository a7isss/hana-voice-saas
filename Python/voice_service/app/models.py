"""
Pydantic models for Hana Voice Service API validation

All input/output data structures are defined here for validation and serialization.
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, validator, root_validator
from enum import Enum
import re


class VoiceServiceCapability(str, Enum):
    """Available voice service capabilities"""
    SPEECH_TO_TEXT = "speech_to_text"
    TEXT_TO_SPEECH = "text_to_speech"
    VOICE_PROCESSING = "voice_processing"
    HEALTHCARE_SURVEYS = "healthcare_surveys"
    TELEPHONY_INTEGRATION = "telephony_integration"


class ServiceStatus(str, Enum):
    """Service operational status"""
    OK = "ok"
    ERROR = "error"
    DEGRADED = "degraded"
    MAINTENANCE = "maintenance"


class HealthCheckResponse(BaseModel):
    """Health check endpoint response model"""
    status: ServiceStatus
    message: str = "Service operational"
    timestamp: str
    version: str = "0.1.0"
    voice_service: Dict[str, Any] = {}
    models: Dict[str, Any] = {}
    memory_usage: Optional[Dict[str, Any]] = None

    class Config:
        json_encoders = {
            # Custom JSON encoders if needed
        }


class ServiceInfo(BaseModel):
    """Root endpoint service information"""
    service: str = "Arabic Healthcare Voice Service"
    version: str = "0.1.0"
    description: str = "AI-powered voice service for Arabic healthcare surveys"
    capabilities: List[str] = Field(
        default_factory=lambda: [
            "speech_to_text",
            "text_to_speech",
            "voice_processing",
            "healthcare_surveys",
            "telephony_integration"
        ]
    )


class AuthRequest(BaseModel):
    """Authentication token request model"""
    grant_type: str = Field(default="client_credentials", description="OAuth2 grant type")
    scope: str = "voice_service"

    @validator('grant_type')
    def validate_grant_type(cls, v):
        if v not in ["client_credentials", "password"]:
            raise ValueError("grant_type must be client_credentials or password")
        return v


class AuthTokenResponse(BaseModel):
    """Authentication token response model"""
    token: str
    token_type: str = "Bearer"
    expires_in: int = 3600  # 1 hour
    session_id: str
    permissions: List[str] = Field(default_factory=lambda: ["voice_service:read"])
    issued_at: str


class VoiceParameters(BaseModel):
    """Voice processing parameters"""
    language: str = Field(default="ar", description="Language code (ar, en, etc.)")
    voice: str = Field(default="default", description="Voice model to use")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed (0.5-2.0)")
    pitch: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech pitch (0.5-2.0)")
    volume: float = Field(default=1.0, ge=0.0, le=2.0, description="Speech volume (0.0-2.0)")

    @validator('language')
    def validate_language(cls, v):
        supported_langs = ['ar', 'en', 'tr', 'fr', 'de', 'es']
        if v not in supported_langs:
            raise ValueError(f"language must be one of: {supported_langs}")
        return v

    @validator('voice')
    def validate_voice(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("voice cannot be empty")
        return v.strip()


class AudioFormat(str, Enum):
    """Supported audio formats"""
    WEBM = "webm"
    MP3 = "mp3"
    WAV = "wav"
    PCM = "pcm"
    MULAW = "mulaw"


class AudioProcessingRequest(BaseModel):
    """Audio processing request model"""
    audio_data: bytes = Field(..., description="Binary audio data")
    format: AudioFormat = Field(default=AudioFormat.WEBM, description="Audio format")
    parameters: VoiceParameters = Field(default_factory=VoiceParameters)

    @validator('audio_data')
    def validate_audio_data(cls, v):
        if len(v) == 0:
            raise ValueError("audio_data cannot be empty")
        if len(v) > 50 * 1024 * 1024:  # 50MB limit
            raise ValueError("audio_data too large (max 50MB)")
        return v

    class Config:
        arbitrary_types_allowed = True


class TextProcessingRequest(BaseModel):
    """Text to speech request model"""
    text: str = Field(..., min_length=1, max_length=2000, description="Text to convert to speech")
    parameters: VoiceParameters = Field(default_factory=VoiceParameters)

    @validator('text')
    def validate_text(cls, v):
        # Remove excessive whitespace
        cleaned = re.sub(r'\s+', ' ', v.strip())
        if not cleaned:
            raise ValueError("text cannot be empty")
        # Basic Arabic text validation
        if not any('\u0600' <= char <= '\u06FF' for char in cleaned):
            # Allow non-Arabic if explicitly requested (future enhancement)
            pass
        return cleaned


class ProcessingResult(BaseModel):
    """General processing result model"""
    success: bool
    result: Dict[str, Any] = {}
    errors: List[str] = Field(default_factory=list)
    processing_time: float
    request_id: str


class SpeechToTextResult(ProcessingResult):
    """Speech to text result model"""
    result: Dict[str, Any] = Field(default_factory=lambda: {
        "text": "",
        "confidence": 0.0,
        "language": "ar",
        "duration": 0.0
    })


class TextToSpeechResult(ProcessingResult):
    """Text to speech result model"""
    result: Dict[str, Any] = Field(default_factory=lambda: {
        "audio_length": 0,
        "audio_format": "webm",
        "voice_used": "default"
    })

    class Config:
        arbitrary_types_allowed = True


class HealthcareSessionState(BaseModel):
    """Healthcare questionnaire session state"""
    session_id: str
    current_question: int = 0
    total_questions: int = 8
    responses: Dict[str, Any] = Field(default_factory=dict)
    context: Dict[str, Any] = Field(default_factory=dict)
    is_complete: bool = False
    started_at: str
    updated_at: str

    @validator('current_question')
    def validate_current_question(cls, v):
        if v < 0 or v > 20:  # Reasonable bounds
            raise ValueError("current_question must be between 0 and 20")
        return v

    @validator('total_questions')
    def validate_total_questions(cls, v):
        if v < 1 or v > 100:
            raise ValueError("total_questions must be between 1 and 100")
        return v


class SessionInfo(BaseModel):
    """Active session information"""
    session_id: str
    client_ip: str
    created_at: str
    last_activity: str
    state: str = "active"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AdminSessionStats(BaseModel):
    """Administrative session statistics"""
    active_sessions: List[SessionInfo]
    total_sessions: int
    max_sessions: int = 10
    uptime_seconds: float
    memory_usage: Dict[str, Any] = Field(default_factory=dict)
    error_rate: float = 0.0


class RateLimitInfo(BaseModel):
    """Rate limiting information"""
    limit: int
    remaining: int
    reset_time: str
    retry_after: Optional[int] = None


class ErrorResponse(BaseModel):
    """Standardized error response model"""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    timestamp: str

    class Config:
        schema_extra = {
            "example": {
                "error": "validation_error",
                "message": "Input validation failed",
                "details": {"field": "input.audio_data", "reason": "Empty audio data"},
                "request_id": "req-123",
                "timestamp": "2024-01-01T12:00:00Z"
            }
        }


class WebSocketMessage(BaseModel):
    """WebSocket message envelope"""
    type: str = Field(description="Message type (audio, text, control, etc.)")
    data: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    sequence_number: Optional[int] = None
    timestamp: str

    class Config:
        schema_extra = {
            "example": {
                "type": "audio",
                "data": {"format": "webm", "length": 1024},
                "metadata": {"session_id": "sess-123"},
                "sequence_number": 1,
                "timestamp": "2024-01-01T12:00:00Z"
            }
        }


# Telephony-specific models
class TelephonyCallInfo(BaseModel):
    """Telephony call information"""
    call_id: str
    caller_number: str
    recipient_number: str
    direction: Literal["inbound", "outbound"]
    status: str = "active"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TelephonyResponse(BaseModel):
    """Telephony processing response"""
    call_id: str
    result: Dict[str, Any]
    next_action: str = "continue"
    recording_url: Optional[str] = None
    transcription: Optional[str] = None


# Configuration models
class VoiceServiceConfig(BaseModel):
    """Voice service configuration settings"""
    enable_stt: bool = True
    enable_tts: bool = True
    enable_healthcare: bool = True
    enable_telephony: bool = False

    stt_model: str = "vosk-arabic"
    tts_model: str = "coqui-arabic"
    default_language: str = "ar"

    max_audio_length_seconds: float = 300.0  # 5 minutes
    max_text_length: int = 2000

    session_timeout_minutes: int = 30
    max_concurrent_sessions: int = 10

    rate_limit_per_minute: int = 60
    rate_limit_burst: int = 10

    class Config:
        env_prefix = "VOICE_"
