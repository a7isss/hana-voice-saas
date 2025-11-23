# app/main.py - FastAPI Application with WebSocket Voice Processing
# Replaces old JSON-to-voice system with real-time Arabic voice interactions

import logging
import os
import time
import hashlib
import hmac
import subprocess
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime, timedelta
import uuid

from app.services import VoiceService
from app.maqsam_handler import MaqsamProtocolHandler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Security Configuration
SECRET_KEY = os.environ.get("VOICE_SERVICE_SECRET", "your-secret-key-change-in-production")
TELEPHONY_TOKEN = os.environ.get("TELEPHONY_TOKEN", None)  # Pre-shared token from telephony company
MAX_CONCURRENT_SESSIONS = int(os.environ.get("MAX_CONCURRENT_SESSIONS", "10"))
RATE_LIMIT_PER_MINUTE = int(os.environ.get("RATE_LIMIT_PER_MINUTE", "60"))

# Global voice service instance (loaded once on startup)
voice_service = None
maqsam_handler = None

# Security state management
active_sessions: Dict[str, Dict[str, Any]] = {}
session_rate_limits: Dict[str, list] = {}
security_bearer = HTTPBearer(auto_error=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load voice models on startup, clean up on shutdown"""
    global voice_service, maqsam_handler
    try:
        logger.info("🚀 Starting Arabic Healthcare Voice Service...")
        voice_service = VoiceService()
        maqsam_handler = MaqsamProtocolHandler(voice_service)
        logger.info("✅ Voice service ready!")
        logger.info("✅ Maqsam protocol handler initialized!")
        yield
    except Exception as e:
        logger.error(f"❌ Failed to initialize voice service: {e}")
        raise
    finally:
        logger.info("🛑 Shutting down voice service...")

# Create FastAPI application
app = FastAPI(
    title="Arabic Healthcare Voice Service",
    description="Self-hosted voice processing for Arabic healthcare questionnaires",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for WebSocket connections (production secure)
frontend_url = os.environ.get("NEXTJS_API_URL", "http://localhost:3000")
render_app_url = "https://hana-voice-saas.onrender.com"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,  # Local development
        render_app_url,  # Render production
        "https://*.onrender.com",  # Allow all Render subdomains
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Arabic Healthcare Voice Service",
        "status": "active",
        "models": {
            "stt": "Vosk Arabic v0.22",
            "tts": "Coqui XTTS v2"
        },
        "capabilities": [
            "Arabic speech recognition",
            "Arabic text-to-speech",
            "Healthcare questionnaire processing",
            "Real-time voice interactions"
        ]
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    if voice_service is None:
        return {"status": "error", "message": "Voice service not initialized"}

    health_status = voice_service.get_health_status()
    return {
        "status": health_status["status"],
        "voice_service": "loaded",
        "models": health_status["models"],
        "timestamp": health_status["timestamp"],
        "version": health_status["version"]
    }

@app.websocket("/ws")
async def websocket_voice_endpoint(websocket: WebSocket):
    """Real-time bidirectional Arabic voice processing

    This replaces the old JSON-to-voice conversion system with:
    1. Audio input (raw bytes) → Arabic speech recognition
    2. Healthcare questionnaire logic → Arabic response generation
    3. Arabic text → Voice output (audio bytes)

    Protocol:
    - Client sends: Raw audio bytes (μ-law encoded from Maqsam)
    - Server responds: Raw audio bytes (Arabic voice response)
    """
    await websocket.accept()
    session_id = f"session_{id(websocket)}"
    logger.info(f"🔌 New voice session: {session_id}")

    # Session context for questionnaire state management
    session_context = {
        "session_id": session_id,
        "questionnaire_state": "initial",
        "patient_responses": {},
        "language": "ar"
    }

    try:
        while True:
            # Step 1: Receive audio data from client
            logger.debug(f"{session_id}: Waiting for audio input...")
            audio_data = await websocket.receive_bytes()
            logger.info(f"{session_id}: Received {len(audio_data)} bytes of audio")

            # Step 2: Process voice interaction (STT → Logic → TTS)
            if voice_service:
                response_text, audio_file_path = voice_service.process_voice_interaction(
                    audio_data, session_context
                )

                logger.info(f"{session_id}: Response: '{response_text}'")

                # Step 3: Send audio response back to client
                if audio_file_path and os.path.exists(audio_file_path):
                    with open(audio_file_path, "rb") as audio_file:
                        audio_bytes = audio_file.read()

                    await websocket.send_bytes(audio_bytes)
                    logger.info(f"{session_id}: Sent {len(audio_bytes)} bytes audio response")

                    # Clean up temporary audio file
                    try:
                        os.remove(audio_file_path)
                        logger.debug(f"{session_id}: Cleaned up {audio_file_path}")
                    except Exception as e:
                        logger.warning(f"{session_id}: Failed to clean up {audio_file_path}: {e}")
                else:
                    logger.error(f"{session_id}: No audio response generated")
                    await websocket.send_text("error: no audio response")
            else:
                logger.error(f"{session_id}: Voice service not available")
                await websocket.send_text("error: voice service unavailable")

    except WebSocketDisconnect:
        logger.info(f"🔌 Voice session {session_id} disconnected")

    except Exception as e:
        logger.error(f"❌ Voice session {session_id} error: {e}")
        try:
            await websocket.send_text(f"error: {str(e)}")
        except:
            pass  # Socket might be closed

    finally:
        logger.info(f"🏁 Voice session {session_id} ended")

@app.websocket("/ws/healthcare-questionnaire")
async def healthcare_questionnaire_endpoint(websocket: WebSocket):
    """Specialized healthcare questionnaire endpoint with session management

    Enhanced version with questionnaire state tracking for:
    - Symptom assessment
    - Pain level evaluation
    - Medication tracking
    - Appointment scheduling
    - Follow-up surveys
    """
    await websocket.accept()
    session_id = f"healthcare_{id(websocket)}"
    logger.info(f"🏥 New healthcare questionnaire session: {session_id}")

    # Enhanced session context for healthcare workflows
    healthcare_context = {
        "session_id": session_id,
        "questionnaire_type": "general_health_assessment",
        "current_question": "initial_greeting",
        "patient_data": {
            "responses": {},
            "symptoms": [],
            "pain_levels": [],
            "medications": [],
            "appointment_needed": False
        },
        "language": "ar",
        "protocol": "healthcare_questionnaire_v1"
    }

    try:
        # Send initial greeting
        welcome_text = "أهلاً وسهلاً في خدمة الاستشارة الصحية. كيف يمكنني مساعدتك اليوم؟"
        await _send_voice_response(websocket, welcome_text, session_id)

        while True:
            # Receive patient audio input
            audio_data = await websocket.receive_bytes()
            logger.info(f"{session_id}: Received {len(audio_data)} bytes from patient")

            # Process with healthcare context
            if voice_service:
                response_text, audio_path = voice_service.process_voice_interaction(
                    audio_data, healthcare_context
                )

                # Update healthcare context based on response
                _update_healthcare_context(response_text, healthcare_context)

                # Send appropriate voice response
                await _send_voice_response(websocket, response_text, session_id, audio_path)

                # Check if questionnaire is complete
                if _is_questionnaire_complete(healthcare_context):
                    break

            else:
                await websocket.send_text("error: voice service unavailable")

    except WebSocketDisconnect:
        logger.info(f"🏥 Healthcare session {session_id} completed")

    except Exception as e:
        logger.error(f"🏥 Healthcare session {session_id} error: {e}")

    finally:
        # Log session results
        logger.info(f"📊 Session {session_id} summary: {healthcare_context['patient_data']}")

async def _send_voice_response(websocket: WebSocket, text: str,
                             session_id: str, audio_path: str = None) -> None:
    """Helper to send voice response with cleanup"""
    try:
        if audio_path and os.path.exists(audio_path):
            with open(audio_path, "rb") as f:
                audio_bytes = f.read()
            await websocket.send_bytes(audio_bytes)
            logger.info(f"{session_id}: Sent {len(audio_bytes)} bytes voice response")
            os.remove(audio_path)  # Clean up
        else:
            # Fallback to text if no audio
            await websocket.send_text(f"text: {text}")
    except Exception as e:
        logger.error(f"{session_id}: Failed to send response: {e}")

def _update_healthcare_context(response_text: str, context: Dict[str, Any]) -> None:
    """Update healthcare questionnaire context based on responses"""
    # Implementation for tracking questionnaire progress
    # This would be expanded based on specific healthcare workflow needs

    if any(word in response_text.lower() for word in ["ألم", "وجع", "pain"]):
        context["current_question"] = "pain_assessment"
    elif any(word in response_text.lower() for word in ["دواء", "medication"]):
        context["current_question"] = "medication_review"
    # Add more healthcare workflow logic as needed

def _is_questionnaire_complete(context: Dict[str, Any]) -> bool:
    """Check if healthcare questionnaire is complete"""
    # Basic completion criteria
    responses = context.get("patient_data", {}).get("responses", {})
    return len(responses) >= 3  # At least 3 responses collected

def decode_webm_audio(webm_bytes: bytes) -> Optional[bytes]:
    """Convert WebM format audio to WAV bytes using ffmpeg (IN-MEMORY ONLY)

    Uses ffmpeg pipes to avoid file I/O entirely - modern, efficient approach.

    Args:
        webm_bytes: WebM audio data from browser MediaRecorder

    Returns:
        Raw WAV audio bytes, or None if conversion fails
    """
    try:
        logger.info("🎵 Starting in-memory WebM → WAV conversion...")
        logger.debug(f"Input WebM data size: {len(webm_bytes)} bytes")

        # Check if ffmpeg is available - try WinGet path first, then PATH
        ffmpeg_paths = [
            r"C:\Users\Ahmad Younis\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin\ffmpeg.exe",  # winGet path
            "ffmpeg.exe"  # try PATH
        ]

        ffmpeg_cmd = None
        for path in ffmpeg_paths:
            try:
                result = subprocess.run([path, '-version'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    ffmpeg_cmd = path
                    logger.info(f"✅ ffmpeg found at: {path}")
                    break
            except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
                continue

        if ffmpeg_cmd is None:
            logger.error("❌ ffmpeg not found. Please install ffmpeg to enable WebM audio processing.")
            return None

        # Modern approach: Use ffmpeg with pipes (stdin → stdout), no files!
        # -f webm: input format
        # -i pipe: read from stdin
        # -f wav: output format
        # pipe:1: write to stdout
        # -acodec pcm_s16le: raw PCM 16-bit
        # -ar 16000: Vosk required sample rate
        # -ac 1: mono channel
        cmd = [
            ffmpeg_cmd,
            '-y',  # overwrite (though not needed with pipes)
            '-f', 'webm',
            '-i', 'pipe:0',  # read from stdin
            '-f', 'wav',
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            'pipe:1'  # write to stdout
        ]

        logger.debug(f"🔄 Running ffmpeg pipe: {' '.join(cmd)}")

        # Start ffmpeg process with stdin/stdout pipes
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            bufsize=0  # unbuffered for real-time
        )

        try:
            # Send WebM data to stdin
            stdout, stderr = process.communicate(
                input=webm_bytes,
                timeout=30  # 30 second timeout
            )

            if process.returncode != 0:
                logger.error(f"❌ ffmpeg pipe conversion failed with return code {process.returncode}")
                logger.error(f"❌ ffmpeg stderr: {stderr.decode() if stderr else 'No stderr'}")
                logger.error(f"❌ ffmpeg stdout length: {len(stdout) if stdout else 0}")
                return None

            if not stdout or len(stdout) < 44:  # WAV header is at least 44 bytes
                logger.error(f"❌ ffmpeg output too small ({len(stdout) if stdout else 0} bytes)")
                return None

            logger.info(f"✅ In-memory WebM → WAV conversion successful: {len(stdout)} bytes WAV")
            logger.debug(".4f")

            return stdout  # Return raw WAV bytes

        except subprocess.TimeoutExpired:
            logger.error("❌ ffmpeg pipe timeout (30s)")
            process.kill()
            return None
        except Exception as e:
            logger.error(f"❌ ffmpeg pipe communication failed: {e}")
            process.kill()
            return None

    except Exception as e:
        logger.error(f"❌ In-memory WebM decoding failed: {e}")
        return None

def is_webm_format(audio_bytes: bytes) -> bool:
    """Check if audio data is WebM format

    Args:
        audio_bytes: Audio data to check

    Returns:
        True if data appears to be WebM format
    """
    try:
        # WebM files start with EBML header
        # First 4 bytes should be 0x1A 0x45 0xDF 0xA3
        if len(audio_bytes) < 4:
            return False

        return audio_bytes[:4] == b'\x1aE\xdf\xa3'
    except Exception:
        return False

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify JWT token for authentication"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Invalid token")
        return None

def verify_telephony_token(token: str) -> bool:
    """Verify pre-shared token from telephony company"""
    if not TELEPHONY_TOKEN:
        logger.warning("Telephony token not configured")
        return False

    if token == TELEPHONY_TOKEN:
        logger.info("Telephony token authenticated successfully")
        return True

    logger.warning("Invalid telephony token provided")
    return False

def check_rate_limit(client_ip: str) -> bool:
    """Check if client has exceeded rate limit"""
    current_time = time.time()

    # Clean old entries (older than 1 minute)
    if client_ip in session_rate_limits:
        session_rate_limits[client_ip] = [
            timestamp for timestamp in session_rate_limits[client_ip]
            if current_time - timestamp < 60
        ]

    # Check current rate
    if client_ip not in session_rate_limits:
        session_rate_limits[client_ip] = []

    if len(session_rate_limits[client_ip]) >= RATE_LIMIT_PER_MINUTE:
        logger.warning(f"Rate limit exceeded for {client_ip}")
        return False

    # Add current request
    session_rate_limits[client_ip].append(current_time)
    return True

def check_concurrent_sessions() -> bool:
    """Check if maximum concurrent sessions exceeded"""
    active_count = len([s for s in active_sessions.values() if s.get("active", False)])
    if active_count >= MAX_CONCURRENT_SESSIONS:
        logger.warning(f"Maximum concurrent sessions ({MAX_CONCURRENT_SESSIONS}) exceeded")
        return False
    return True

def generate_session_token(session_id: str, client_ip: str) -> str:
    """Generate secure session token"""
    payload = {
        "session_id": session_id,
        "client_ip": client_ip,
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

@app.get("/auth/token")
async def get_auth_token(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)):
    """Generate authentication token for voice service access"""
    if not credentials or credentials.credentials != SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid authentication")

    # Generate token with session limits
    if not check_concurrent_sessions():
        raise HTTPException(status_code=429, detail="Too many concurrent sessions")

    session_id = f"auth_{int(time.time())}"
    token = generate_session_token(session_id, "system")

    # Track active session
    active_sessions[session_id] = {
        "active": True,
        "created_at": time.time(),
        "client_ip": "system"
    }

    logger.info(f"🔑 Generated auth token for session: {session_id}")
    return {"token": token, "session_id": session_id}

@app.websocket("/ws/secure")
async def secure_websocket_endpoint(websocket: WebSocket, token: str = None):
    """Secure WebSocket endpoint with authentication and rate limiting"""
    client_ip = websocket.client.host if websocket.client else "unknown"

    # Rate limiting check
    if not check_rate_limit(client_ip):
        await websocket.close(code=429, reason="Rate limit exceeded")
        return

    # Token verification (Optional for internal/dev mode)
    if token:
        token_payload = verify_token(token)
        if not token_payload:
            await websocket.close(code=401, reason="Invalid or expired token")
            return
        
        # Session limit check (only for authenticated sessions)
        if not check_concurrent_sessions():
            await websocket.close(code=429, reason="Too many concurrent sessions")
            return

        await websocket.accept()
        session_id = token_payload.get("session_id", f"secure_{id(websocket)}")
        logger.info(f"🔐 Secure voice session: {session_id} from {client_ip}")

        # Track active session
        active_sessions[session_id] = {
            "active": True,
            "created_at": time.time(),
            "client_ip": client_ip,
            "authenticated": True
        }
    else:
        # Allow unauthenticated internal connections with warning
        logger.warning(f"⚠️ Unauthenticated connection from {client_ip} (Internal/Dev Mode)")
        await websocket.accept()
        session_id = f"internal_{id(websocket)}"
        
        # Track active session
        active_sessions[session_id] = {
            "active": True,
            "created_at": time.time(),
            "client_ip": client_ip,
            "authenticated": False
        }

    # Session context for questionnaire state management
    session_context = {
        "session_id": session_id,
        "questionnaire_state": "initial",
        "patient_responses": {},
        "language": "ar",
        "authenticated": bool(token)
    }

    try:
        while True:
            # Step 1: Receive audio data from client
            logger.debug(f"{session_id}: Waiting for audio input...")
            audio_data = await websocket.receive_bytes()
            logger.info(f"{session_id}: Received {len(audio_data)} bytes of audio")

            # Step 2: Process voice interaction (STT → Logic → TTS)
            if voice_service:
                response_text, audio_file_path = voice_service.process_voice_interaction(
                    audio_data, session_context
                )

                logger.info(f"{session_id}: Response: '{response_text}'")

                # Step 3: Send audio response back to client
                if audio_file_path and os.path.exists(audio_file_path):
                    with open(audio_file_path, "rb") as audio_file:
                        audio_bytes = audio_file.read()

                    await websocket.send_bytes(audio_bytes)
                    logger.info(f"{session_id}: Sent {len(audio_bytes)} bytes audio response")

                    # Clean up temporary audio file
                    try:
                        os.remove(audio_file_path)
                        logger.debug(f"{session_id}: Cleaned up {audio_file_path}")
                    except Exception as e:
                        logger.warning(f"{session_id}: Failed to clean up {audio_file_path}: {e}")
                else:
                    logger.error(f"{session_id}: No audio response generated")
                    await websocket.send_text("error: no audio response")
            else:
                logger.error(f"{session_id}: Voice service not available")
                await websocket.send_text("error: voice service unavailable")

    except WebSocketDisconnect:
        logger.info(f"🔐 Secure voice session {session_id} disconnected")

    except Exception as e:
        logger.error(f"❌ Secure voice session {session_id} error: {e}")
        try:
            await websocket.send_text(f"error: {str(e)}")
        except:
            pass  # Socket might be closed

    finally:
        # Clean up session
        if session_id in active_sessions:
            active_sessions[session_id]["active"] = False
        logger.info(f"🏁 Secure voice session {session_id} ended")

@app.websocket("/ws/secure/healthcare")
async def secure_healthcare_endpoint(websocket: WebSocket, token: str = None):
    """Secure healthcare questionnaire endpoint with full authentication"""
    client_ip = websocket.client.host if websocket.client else "unknown"

    # Rate limiting check
    if not check_rate_limit(client_ip):
        await websocket.close(code=429, reason="Rate limit exceeded")
        return

    # Token verification (Optional for internal/dev mode)
    if token:
        token_payload = verify_token(token)
        if not token_payload:
            await websocket.close(code=401, reason="Invalid or expired token")
            return

        # Session limit check
        if not check_concurrent_sessions():
            await websocket.close(code=429, reason="Too many concurrent sessions")
            return

        await websocket.accept()
        session_id = f"secure_healthcare_{id(websocket)}"
        logger.info(f"🏥🔐 Secure healthcare session: {session_id} from {client_ip}")

        # Track active session
        active_sessions[session_id] = {
            "active": True,
            "created_at": time.time(),
            "client_ip": client_ip,
            "authenticated": True,
            "type": "healthcare"
        }
    else:
        # Allow unauthenticated internal connections with warning
        logger.warning(f"⚠️ Unauthenticated connection from {client_ip} (Internal/Dev Mode)")
        await websocket.accept()
        session_id = f"internal_healthcare_{id(websocket)}"
        
        # Track active session
        active_sessions[session_id] = {
            "active": True,
            "created_at": time.time(),
            "client_ip": client_ip,
            "authenticated": False,
            "type": "healthcare"
        }


    # Enhanced session context for healthcare workflows
    healthcare_context = {
        "session_id": session_id,
        "questionnaire_type": "general_health_assessment",
        "current_question": "initial_greeting",
        "patient_data": {
            "responses": {},
            "symptoms": [],
            "pain_levels": [],
            "medications": [],
            "appointment_needed": False
        },
        "language": "ar",
        "protocol": "healthcare_questionnaire_v1",
        "authenticated": True
    }

    try:
        # Send initial greeting
        welcome_text = "أهلاً وسهلاً في خدمة الاستشارة الصحية الآمنة. كيف يمكنني مساعدتك اليوم؟"
        await _send_voice_response(websocket, welcome_text, session_id)

        while True:
            # Receive patient audio input
            audio_data = await websocket.receive_bytes()
            logger.info(f"{session_id}: Received {len(audio_data)} bytes from patient")

            # Process with healthcare context
            if voice_service:
                response_text, audio_path = voice_service.process_voice_interaction(
                    audio_data, healthcare_context
                )

                # Update healthcare context based on response
                _update_healthcare_context(response_text, healthcare_context)

                # Send appropriate voice response
                await _send_voice_response(websocket, response_text, session_id, audio_path)

                # Check if questionnaire is complete
                if _is_questionnaire_complete(healthcare_context):
                    break

            else:
                await websocket.send_text("error: voice service unavailable")

    except WebSocketDisconnect:
        logger.info(f"🏥🔐 Secure healthcare session {session_id} completed")

    except Exception as e:
        logger.error(f"🏥🔐 Secure healthcare session {session_id} error: {e}")

    finally:
        # Log session results
        logger.info(f"📊 Secure session {session_id} summary: {healthcare_context['patient_data']}")
        # Clean up session
        if session_id in active_sessions:
            active_sessions[session_id]["active"] = False

@app.websocket("/ws/telephony")
async def telephony_websocket_endpoint(websocket: WebSocket, token: str = None):
    """WebSocket endpoint for telephony company using pre-shared token

    URL format: ws://your-server/ws/telephony?token=pre-shared-token

    Receives: Raw μ-law audio bytes from telephony system
    Sends: Raw audio bytes as Arabic voice responses
    """
    # Verify telephony token
    if not verify_telephony_token(token):
        logger.warning(f"❌ Telephony authentication failed from {websocket.client.host}")
        await websocket.close(code=401, reason="Invalid token")
        return

    await websocket.accept()
    session_id = f"telephony_{int(time.time())}_{id(websocket)}"
    client_ip = websocket.client.host if websocket.client else "telephony"
    logger.info(f"📞 Telephony session: {session_id} from {client_ip}")

    # Session context for voice processing
    session_context = {
        "session_id": session_id,
        "questionnaire_state": "initial",
        "patient_responses": {},
        "language": "ar",
        "source": "telephony"
    }

    # Track active session
    active_sessions[session_id] = {
        "active": True,
        "created_at": time.time(),
        "client_ip": client_ip,
        "type": "telephony",
        "authenticated": True
    }

    try:
        while True:
            # Receive audio from telephony system
            audio_data = await websocket.receive_bytes()
            logger.info(f"{session_id}: Received {len(audio_data)} bytes audio")

            # Process voice interaction
            if voice_service:
                response_text, audio_file_path = voice_service.process_voice_interaction(
                    audio_data, session_context
                )

                logger.info(f"{session_id}: Responding: '{response_text}'")

                # Send audio response
                if audio_file_path and os.path.exists(audio_file_path):
                    with open(audio_file_path, "rb") as f:
                        audio_bytes = f.read()
                    await websocket.send_bytes(audio_bytes)
                    logger.info(f"{session_id}: Sent {len(audio_bytes)} bytes audio")
                    os.remove(audio_file_path)  # Clean up
                else:
                    await websocket.send_text("error: no response")
            else:
                await websocket.send_text("error: voice service unavailable")

    except WebSocketDisconnect:
        logger.info(f"📞 Telephony session {session_id} ended")

    except Exception as e:
        logger.error(f"❌ Telephony session {session_id} error: {e}")

    finally:
        if session_id in active_sessions:
            active_sessions[session_id]["active"] = False

@app.websocket("/ws/tts")
async def tts_websocket_endpoint(websocket: WebSocket):
    """Standalone TTS (Text-to-Speech) endpoint for voice script testing

    Simple single-step process:
    1. Text input (prefixed with 'tts:') → Arabic TTS audio output

    This endpoint converts Arabic text to speech without any STT processing.
    Used by voice-tester script playback feature.
    URL: ws://localhost:8000/ws/tts
    """
    await websocket.accept()
    session_id = f"tts_{id(websocket)}"
    logger.info(f"🔊 TTS session started: {session_id}")

    try:
        while True:
            logger.info(f"🔊 {session_id}: Waiting for text data...")
            # Receive text message (e.g., "tts:مرحباً بكم")
            text_message = await websocket.receive_text()
            logger.info(f"📝 {session_id}: TEXT RECEIVED - '{text_message}'")

            if voice_service:
                # Check if message starts with 'tts:' prefix
                if text_message.startswith('tts:'):
                    arabic_text = text_message[4:].strip()  # Remove 'tts:' prefix
                    logger.info(f"🔊 {session_id}: Processing TTS for: '{arabic_text}'")

                    if arabic_text:
                        # Generate TTS audio
                        audio_file_path = voice_service.text_to_speech(arabic_text)

                        if audio_file_path and os.path.exists(audio_file_path):
                            # Read and send audio file
                            with open(audio_file_path, "rb") as audio_file:
                                audio_bytes = audio_file.read()

                            logger.info(f"✅ {session_id}: TTS audio generated: {len(audio_bytes)} bytes")
                            await websocket.send_bytes(audio_bytes)
                            logger.info(f"📤 {session_id}: Sent TTS audio to client")

                            # Clean up temporary file
                            try:
                                os.remove(audio_file_path)
                                logger.debug(f"🗑️ {session_id}: Cleaned up {audio_file_path}")
                            except Exception as e:
                                logger.warning(f"⚠️ {session_id}: Failed to clean up {audio_file_path}: {e}")
                        else:
                            logger.error(f"❌ {session_id}: TTS failed to generate audio")
                            await websocket.send_text("error: tts generation failed")
                    else:
                        logger.warning(f"⚠️ {session_id}: Empty text received")
                        await websocket.send_text("error: empty text")
                else:
                    logger.warning(f"⚠️ {session_id}: Invalid message format: '{text_message}'")
                    await websocket.send_text("error: invalid format - use 'tts:Arabic text'")
            else:
                logger.error(f"❌ {session_id}: Voice service not available")
                await websocket.send_text("error: voice service unavailable")

    except WebSocketDisconnect:
        logger.info(f"🔊 TTS session {session_id} disconnected")

    except Exception as e:
        logger.error(f"❌ TTS session {session_id} error: {e}")
        logger.error(f"❌ Error details: {type(e).__name__}: {str(e)}")
        try:
            await websocket.send_text(f"error: {str(e)}")
        except:
            pass  # Socket might be closed

@app.websocket("/ws/echo")
async def echo_websocket_endpoint(websocket: WebSocket):
    """Simple STT-only endpoint for testing Arabic speech recognition

    Simple single-step process:
    1. Audio input → Arabic STT transcription ONLY (no TTS response)

    This endpoint is for testing STT functionality without automatic replies.
    URL: ws://localhost:8000/ws/echo
    """
    await websocket.accept()
    session_id = f"echo_{id(websocket)}"
    logger.info(f"🔄 Echo session started: {session_id}")

    try:
        while True:
            logger.info(f"🔄 {session_id}: Waiting for audio data...")
            # Receive audio data
            audio_data = await websocket.receive_bytes()
            logger.info(f"🎙️ {session_id}: AUDIO RECEIVED - {len(audio_data)} bytes")
            logger.info(f"📊 {session_id}: Audio data sample (first 50 bytes): {audio_data[:50] if len(audio_data) >= 50 else audio_data}")

            if voice_service:
                logger.info(f"🔄 {session_id}: Starting STT processing...")

                # Check if audio is WebM format and decode it
                if is_webm_format(audio_data):
                    logger.info(f"🎵 {session_id}: Detected WebM format, decoding to WAV...")
                    decoded_audio = decode_webm_audio(audio_data)
                    if decoded_audio:
                        logger.info(f"✅ {session_id}: WebM decoded successfully - {len(decoded_audio)} bytes WAV")
                        audio_data = decoded_audio
                    else:
                        logger.error(f"❌ {session_id}: WebM decoding failed, using original data")
                        await websocket.send_text("error: audio format conversion failed")
                        continue

                # Process transcription only (no logic, just STT)
                transcribed_text = voice_service.speech_to_text(audio_data)
                logger.info(f"📝 {session_id}: STT RESULT - Transcribed: '{transcribed_text}' (length: {len(transcribed_text)})")

                if transcribed_text and transcribed_text.strip():
                    clean_text = transcribed_text.strip()
                    logger.info(f"✅ {session_id}: Valid transcription found: '{clean_text}'")

                    # Send the transcription text ONLY (no TTS echo)
                    text_msg = f"transcription: {clean_text}"
                    try:
                        await websocket.send_text(text_msg)
                        logger.info(f"📤 {session_id}: SENT transcription to client: {text_msg}")
                    except Exception as send_error:
                        logger.error(f"❌ {session_id}: Failed to send transcription: {send_error}")
                else:
                    logger.warning(f"❌ {session_id}: No transcription detected - empty result")
                    logger.info(f"❌ {session_id}: Sending error message to client")
                    try:
                        await websocket.send_text("error: no speech detected")
                    except Exception as send_error:
                        logger.error(f"❌ {session_id}: Failed to send error message: {send_error}")
            else:
                logger.error(f"{session_id}: Voice service not available")
                await websocket.send_text("error: voice service unavailable")

    except WebSocketDisconnect:
        logger.info(f"🔄 Echo session {session_id} disconnected")

    except Exception as e:
        logger.error(f"❌ Echo session {session_id} error: {e}")
        logger.error(f"❌ Error details: {type(e).__name__}: {str(e)}")
        try:
            await websocket.send_text(f"error: {str(e)}")
        except:
            pass  # Socket might be closed

@app.websocket("/ws/telephony/healthcare")
async def telephony_healthcare_endpoint(websocket: WebSocket, token: str = None):
    """Healthcare questionnaire endpoint for telephony company

    URL format: ws://your-server/ws/telephony/healthcare?token=pre-shared-token

    Provides structured healthcare interactions:
    - Symptom assessment
    - Pain level evaluation
    - Medication tracking
    - Appointment coordination
    """
    # Verify telephony token
    if not verify_telephony_token(token):
        logger.warning(f"❌ Telephony healthcare auth failed from {websocket.client.host}")
        await websocket.close(code=401, reason="Invalid token")
        return

    await websocket.accept()
    session_id = f"telephony_healthcare_{int(time.time())}_{id(websocket)}"
    client_ip = websocket.client.host if websocket.client else "telephony"
    logger.info(f"🏥📞 Telephony healthcare session: {session_id} from {client_ip}")

    active_sessions[session_id] = {
        "active": True,
        "created_at": time.time(),
        "client_ip": client_ip,
        "type": "telephony_healthcare",
        "authenticated": True
    }

    healthcare_context = {
        "session_id": session_id,
        "questionnaire_type": "telephony_health_assessment",
        "current_question": "initial_greeting",
        "patient_data": {
            "responses": {},
            "symptoms": [],
            "pain_levels": [],
            "medications": [],
            "appointment_needed": False
        },
        "language": "ar",
        "source": "telephony"
    }

    try:
        # Send Arabic welcome
        welcome_text = "أهلاً وسهلاً. يرجى التحدث بوضوح لمساعدتك في تقييم حالتك الصحية."
        await _send_voice_response(websocket, welcome_text, session_id)

        while True:
            # Receive patient audio
            audio_data = await websocket.receive_bytes()
            logger.info(f"{session_id}: Received {len(audio_data)} bytes healthcare audio")

            if voice_service:
                response_text, audio_path = voice_service.process_voice_interaction(
                    audio_data, healthcare_context
                )

                # Update healthcare context
                _update_healthcare_context(response_text, healthcare_context)

                # Send response
                await _send_voice_response(websocket, response_text, session_id, audio_path)

                # Check completion
                if _is_questionnaire_complete(healthcare_context):
                    break
            else:
                await websocket.send_text("error: voice service unavailable")

    except WebSocketDisconnect:
        logger.info(f"🏥📞 Healthcare session {session_id} completed")

    except Exception as e:
        logger.error(f"🏥📞 Healthcare session {session_id} error: {e}")

    finally:
        logger.info(f"📊 Healthcare session {session_id} summary: {healthcare_context['patient_data']}")
        if session_id in active_sessions:
            active_sessions[session_id]["active"] = False

@app.get("/admin/sessions")
async def get_active_sessions(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)):
    """Get active session information (admin only)"""
    if not credentials or credentials.credentials != SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid authentication")

    return {
        "active_sessions": len([s for s in active_sessions.values() if s.get("active", False)]),
        "total_sessions": len(active_sessions),
        "max_sessions": MAX_CONCURRENT_SESSIONS,
        "rate_limits": {ip: len(timestamps) for ip, timestamps in session_rate_limits.items()}
    }

@app.get("/admin/health")
async def admin_health_check(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)):
    """Comprehensive health check with security metrics"""
    if not credentials or credentials.credentials != SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid authentication")

    if voice_service is None:
        return {"status": "error", "message": "Voice service not initialized"}

    health_status = voice_service.get_health_status()
    
    # Include Maqsam session info if available
    maqsam_info = {}
    if maqsam_handler:
        maqsam_info = maqsam_handler.get_active_sessions()

    return {
        "status": health_status["status"],
        "voice_service": "loaded",
        "models": health_status["models"],
        "security": {
            "active_sessions": len([s for s in active_sessions.values() if s.get("active", False)]),
            "max_sessions": MAX_CONCURRENT_SESSIONS,
            "rate_limits": {ip: len(timestamps) for ip, timestamps in session_rate_limits.items()},
            "total_requests_today": sum(len(timestamps) for timestamps in session_rate_limits.values()),
            "maqsam_sessions": maqsam_info.get("active_sessions", 0)
        },
        "maqsam": maqsam_info,
        "timestamp": datetime.utcnow().isoformat(),
        "version": health_status["version"]
    }

from fastapi.responses import Response
from pydantic import BaseModel

class TTSRequest(BaseModel):
    text: str
    language: str = "ar"

@app.post("/tts")
async def text_to_speech_http(request: TTSRequest, credentials: HTTPAuthorizationCredentials = Depends(security_bearer)):
    """HTTP endpoint for Text-to-Speech generation"""
    if not credentials or credentials.credentials != SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid authentication")

    if not voice_service:
        raise HTTPException(status_code=503, detail="Voice service not initialized")

    try:
        logger.info(f"🔊 HTTP TTS Request: '{request.text}'")
        audio_file_path = voice_service.text_to_speech(request.text)

        if audio_file_path and os.path.exists(audio_file_path):
            with open(audio_file_path, "rb") as audio_file:
                audio_bytes = audio_file.read()
            
            # Clean up
            os.remove(audio_file_path)
            
            return Response(content=audio_bytes, media_type="audio/wav")
        else:
            raise HTTPException(status_code=500, detail="TTS generation failed")
            
    except Exception as e:
        logger.error(f"❌ HTTP TTS Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# MAQSAM TELEPHONY ENDPOINTS - Full Protocol Implementation
# =============================================================================

def extract_maqsam_token(websocket: WebSocket) -> Optional[str]:
    """
    Extract Maqsam token from either:
    1. HTTP Authorization header (preferred)
    2. Query parameter (fallback)
    """
    # Check Authorization header first (Maqsam preferred method)
    auth_header = websocket.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]  # Remove "Bearer " prefix
    
    # Check query parameter as fallback
    query_params = dict(websocket.query_params)
    return query_params.get("token")

@app.websocket("/ws/maqsam")
async def maqsam_websocket_endpoint(websocket: WebSocket):
    """
    Maqsam WebSocket endpoint with full protocol support
    
    URL: ws://your-server/ws/maqsam
    Authentication: Bearer token in Authorization header OR token query parameter
    
    Protocol:
    - session.setup → session.ready handshake
    - audio.input (Base64 μ-law) → response.stream (Base64 μ-law)
    - Full Maqsam message types support
    """
    # Extract token from header or query parameter
    token = extract_maqsam_token(websocket)
    
    if not token:
        logger.warning("❌ Maqsam authentication failed - no token provided")
        await websocket.close(code=401, reason="Authentication required")
        return
    
    if not verify_telephony_token(token):
        logger.warning(f"❌ Maqsam authentication failed from {websocket.client.host}")
        await websocket.close(code=401, reason="Invalid token")
        return
    
    # Use Maqsam protocol handler for full protocol support
    if maqsam_handler:
        await maqsam_handler.handle_maqsam_connection(websocket, token)
    else:
        logger.error("❌ Maqsam handler not available")
        await websocket.close(code=503, reason="Service unavailable")

@app.websocket("/ws/maqsam/healthcare")
async def maqsam_healthcare_endpoint(websocket: WebSocket):
    """
    Maqsam healthcare questionnaire endpoint
    
    URL: ws://your-server/ws/maqsam/healthcare
    Authentication: Bearer token in Authorization header OR token query parameter
    
    Features:
    - Healthcare-specific conversation flow
    - Symptom assessment
    - Arabic healthcare terminology
    - Structured patient data collection
    """
    # Extract token from header or query parameter
    token = extract_maqsam_token(websocket)
    
    if not token:
        logger.warning("❌ Maqsam healthcare authentication failed - no token provided")
        await websocket.close(code=401, reason="Authentication required")
        return
    
    if not verify_telephony_token(token):
        logger.warning(f"❌ Maqsam healthcare authentication failed from {websocket.client.host}")
        await websocket.close(code=401, reason="Invalid token")
        return
    
    # Use Maqsam protocol handler with healthcare agent
    if maqsam_handler:
        await maqsam_handler.handle_maqsam_connection(websocket, token, agent="healthcare")
    else:
        logger.error("❌ Maqsam handler not available")
        await websocket.close(code=503, reason="Service unavailable")

@app.websocket("/ws/maqsam/test")
async def maqsam_test_endpoint(websocket: WebSocket):
    """
    Maqsam test endpoint for protocol validation
    
    URL: ws://your-server/ws/maqsam/test
    Authentication: Bearer token in Authorization header OR token query parameter
    
    Used for:
    - Protocol testing and validation
    - Audio format verification
    - Connection health checks
    """
    # Extract token from header or query parameter
    token = extract_maqsam_token(websocket)
    
    if not token:
        logger.warning("❌ Maqsam test authentication failed - no token provided")
        await websocket.close(code=401, reason="Authentication required")
        return
    
    if not verify_telephony_token(token):
        logger.warning(f"❌ Maqsam test authentication failed from {websocket.client.host}")
        await websocket.close(code=401, reason="Invalid token")
        return
    
    # Use Maqsam protocol handler with test agent
    if maqsam_handler:
        await maqsam_handler.handle_maqsam_connection(websocket, token, agent="test")
    else:
        logger.error("❌ Maqsam handler not available")
        await websocket.close(code=503, reason="Service unavailable")

@app.get("/maqsam/status")
async def maqsam_status():
    """Get Maqsam integration status and session information"""
    if not maqsam_handler:
        return {
            "status": "error",
            "message": "Maqsam handler not initialized",
            "integration": "inactive"
        }
    
    maqsam_info = maqsam_handler.get_active_sessions()
    
    return {
        "status": "active",
        "integration": "ready",
        "protocol": "Maqsam WebSocket v1.0",
        "endpoints": {
            "primary": "/ws/maqsam",
            "healthcare": "/ws/maqsam/healthcare", 
            "test": "/ws/maqsam/test"
        },
        "authentication": {
            "methods": ["HTTP Bearer Token", "Query Parameter"],
            "status": "configured" if TELEPHONY_TOKEN else "not_configured"
        },
        "sessions": maqsam_info,
        "audio_format": {
            "input": "Base64 μ-law (8000 Hz, mono)",
            "output": "Base64 μ-law (8000 Hz, mono)",
            "processing": "WAV (16000 Hz, mono)"
        }
    }

# =============================================================================
# TELEPHONY TEST ENDPOINTS - Mirroring your existing working endpoints
# =============================================================================

@app.websocket("/ws/telephony/test")
async def telephony_test_endpoint(websocket: WebSocket, token: str = None):
    """
    Telephony test endpoint that mirrors your existing working test endpoints
    
    URL: ws://your-server/ws/telephony/test?token=pre-shared-token
    Same behavior as /ws/echo but with telephony authentication
    """
    # Verify telephony token
    if not verify_telephony_token(token):
        logger.warning(f"❌ Telephony test auth failed from {websocket.client.host}")
        await websocket.close(code=401, reason="Invalid token")
        return

    await websocket.accept()
    session_id = f"telephony_test_{int(time.time())}_{id(websocket)}"
    client_ip = websocket.client.host if websocket.client else "telephony"
    logger.info(f"🧪 Telephony test session: {session_id} from {client_ip}")

    try:
        while True:
            # Receive test audio
            audio_data = await websocket.receive_bytes()
            logger.info(f"{session_id}: Test audio received - {len(audio_data)} bytes")

            if voice_service:
                # Simple STT echo for testing
                transcribed_text = voice_service.speech_to_text(audio_data)
                
                if transcribed_text and transcribed_text.strip():
                    await websocket.send_text(f"test_result: {transcribed_text.strip()}")
                    logger.info(f"{session_id}: Test STT result: '{transcribed_text.strip()}'")
                else:
                    await websocket.send_text("test_result: no_speech_detected")
                    logger.info(f"{session_id}: Test STT result: no speech detected")
            else:
                await websocket.send_text("error: voice_service_unavailable")

    except WebSocketDisconnect:
        logger.info(f"🧪 Telephony test session {session_id} completed")

    except Exception as e:
        logger.error(f"❌ Telephony test session {session_id} error: {e}")

@app.websocket("/ws/telephony/tts")
async def telephony_tts_endpoint(websocket: WebSocket, token: str = None):
    """
    Telephony TTS endpoint that mirrors your existing working TTS endpoints
    
    URL: ws://your-server/ws/telephony/tts?token=pre-shared-token
    Same behavior as /ws/tts but with telephony authentication
    """
    # Verify telephony token
    if not verify_telephony_token(token):
        logger.warning(f"❌ Telephony TTS auth failed from {websocket.client.host}")
        await websocket.close(code=401, reason="Invalid token")
        return

    await websocket.accept()
    session_id = f"telephony_tts_{int(time.time())}_{id(websocket)}"
    client_ip = websocket.client.host if websocket.client else "telephony"
    logger.info(f"🔊 Telephony TTS session: {session_id} from {client_ip}")

    try:
        while True:
            # Receive text for TTS
            text_message = await websocket.receive_text()
            logger.info(f"{session_id}: TTS text received: '{text_message}'")

            if voice_service:
                # Generate TTS audio
                audio_file_path = voice_service.text_to_speech(text_message)

                if audio_file_path and os.path.exists(audio_file_path):
                    with open(audio_file_path, "rb") as f:
                        audio_bytes = f.read()
                    await websocket.send_bytes(audio_bytes)
                    logger.info(f"{session_id}: TTS audio sent - {len(audio_bytes)} bytes")
                    os.remove(audio_file_path)
                else:
                    await websocket.send_text("error: tts_generation_failed")
            else:
                await websocket.send_text("error: voice_service_unavailable")

    except WebSocketDisconnect:
        logger.info(f"🔊 Telephony TTS session {session_id} completed")

    except Exception as e:
        logger.error(f"❌ Telephony TTS session {session_id} error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=True,
        log_level="info"
    )
