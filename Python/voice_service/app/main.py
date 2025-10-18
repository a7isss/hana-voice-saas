# app/main.py - FastAPI Application with WebSocket Voice Processing
# Replaces old JSON-to-voice system with real-time Arabic voice interactions

import logging
import os
from contextlib import asynccontextmanager
from typing import Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.services import VoiceService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Global voice service instance (loaded once on startup)
voice_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load voice models on startup, clean up on shutdown"""
    global voice_service
    try:
        logger.info("🚀 Starting Arabic Healthcare Voice Service...")
        voice_service = VoiceService()
        logger.info("✅ Voice service ready!")
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

# Configure CORS for WebSocket connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
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
    return {
        "status": "healthy",
        "voice_service": "loaded",
        "models": {
            "vosk_arabic": "available",
            "coqui_xtts": "available"
        }
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=True,
        log_level="info"
    )
