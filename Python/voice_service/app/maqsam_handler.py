"""
Maqsam Telephony Integration Handler
Implements the complete Maqsam WebSocket protocol for Arabic healthcare voice calls
"""

import logging
import json
import base64
import time
from typing import Dict, Any, Optional, List, Tuple
from fastapi import WebSocket, WebSocketDisconnect
import os
import httpx
import jwt
from datetime import datetime, timedelta
from app.services import VoiceService

logger = logging.getLogger(__name__)

class MaqsamProtocolHandler:
    """
    Handles Maqsam telephony WebSocket protocol according to their specification
    """
    
    def __init__(self, voice_service: VoiceService):
        self.voice_service = voice_service
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        
        # Maqsam protocol constants
        self.AUDIO_FORMAT = "mulaw"
        self.SAMPLE_RATE = 8000
        self.CHANNELS = 1
        
        # API configuration for response submission
        self.nextjs_api_url = os.getenv("NEXTJS_API_URL", "http://localhost:3000")
        self.api_secret = os.getenv("VOICE_SERVICE_SECRET", "")
        
        # HTTP client for API calls
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
        logger.info(f"MaqsamProtocolHandler initialized with API URL: {self.nextjs_api_url}")
        
    async def handle_maqsam_connection(self, websocket: WebSocket, token: str, agent: str = None):
        """
        Main entry point for Maqsam telephony connections
        """
        session_id = f"maqsam_{int(time.time())}_{id(websocket)}"
        client_ip = websocket.client.host if websocket.client else "maqsam"
        
        logger.info(f"📞 Maqsam session started: {session_id} from {client_ip}, agent: {agent}")
        
        # Session context for voice processing
        session_context = {
            "session_id": session_id,
            "questionnaire_state": "initial",
            "patient_responses": {},
            "language": "ar",
            "source": "maqsam",
            "agent": agent,
            "call_context": {}
        }
        
        # Track active session
        self.active_sessions[session_id] = {
            "active": True,
            "created_at": time.time(),
            "client_ip": client_ip,
            "agent": agent,
            "authenticated": True
        }
        
        try:
            # Step 1: Wait for session.setup message
            await self._handle_session_setup(websocket, session_id, session_context)
            
            # Step 2: Send session.ready to confirm setup
            await self._send_session_ready(websocket, session_id)
            
            # Step 3: Main audio processing loop
            await self._process_audio_loop(websocket, session_id, session_context)
            
        except WebSocketDisconnect:
            logger.info(f"📞 Maqsam session {session_id} ended normally")
        except Exception as e:
            logger.error(f"❌ Maqsam session {session_id} error: {e}")
        finally:
            # Clean up session
            if session_id in self.active_sessions:
                self.active_sessions[session_id]["active"] = False
            logger.info(f"🏁 Maqsam session {session_id} completed")
    
    async def _handle_session_setup(self, websocket: WebSocket, session_id: str, session_context: Dict[str, Any]):
        """
        Handle Maqsam session.setup message with call context
        """
        logger.info(f"{session_id}: Waiting for session.setup message...")
        
        try:
            # Receive session setup message
            message = await websocket.receive_text()
            data = json.loads(message)
            
            if data.get("type") != "session.setup":
                logger.error(f"{session_id}: Expected session.setup, got {data.get('type')}")
                await websocket.close(code=1002, reason="Expected session.setup message")
                return
            
            # Extract call context
            call_context = data.get("data", {}).get("context", {})
            session_context["call_context"] = call_context
            
            logger.info(f"{session_id}: Session setup received - Caller: {call_context.get('caller_number')}, "
                       f"Callee: {call_context.get('callee_number')}, Direction: {call_context.get('direction')}")
            
            # Log custom context if present
            custom_context = call_context.get("custom", {})
            if custom_context:
                logger.info(f"{session_id}: Custom context: {custom_context}")
                
        except json.JSONDecodeError as e:
            logger.error(f"{session_id}: Invalid JSON in session.setup: {e}")
            await websocket.close(code=1002, reason="Invalid JSON format")
            raise
        except Exception as e:
            logger.error(f"{session_id}: Error handling session.setup: {e}")
            await websocket.close(code=1002, reason="Session setup failed")
            raise
    
    async def _send_session_ready(self, websocket: WebSocket, session_id: str):
        """
        Send session.ready message to confirm setup completion
        """
        ready_message = {
            "type": "session.ready"
        }
        
        await websocket.send_text(json.dumps(ready_message))
        logger.info(f"{session_id}: Sent session.ready confirmation")
    
    async def _process_audio_loop(self, websocket: WebSocket, session_id: str, session_context: Dict[str, Any]):
        """
        Main audio processing loop for Maqsam calls
        """
        while True:
            try:
                # Receive message from Maqsam
                message = await websocket.receive_text()
                data = json.loads(message)
                message_type = data.get("type")
                
                logger.debug(f"{session_id}: Received message type: {message_type}")
                
                if message_type == "audio.input":
                    await self._handle_audio_input(websocket, data, session_id, session_context)
                elif message_type == "call.dtmf":
                    await self._handle_dtmf_input(data, session_id, session_context)
                elif message_type == "call.mark":
                    await self._handle_call_mark(data, session_id)
                else:
                    logger.warning(f"{session_id}: Unhandled message type: {message_type}")
                    
            except json.JSONDecodeError as e:
                logger.error(f"{session_id}: Invalid JSON message: {e}")
                continue
            except Exception as e:
                logger.error(f"{session_id}: Error processing message: {e}")
                raise
    
    async def _handle_audio_input(self, websocket: WebSocket, data: Dict[str, Any], 
                                session_id: str, session_context: Dict[str, Any]):
        """
        Handle incoming audio from Maqsam (Base64 μ-law encoded)
        """
        try:
            # Extract Base64 encoded μ-law audio
            audio_base64 = data.get("data", {}).get("audio", "")
            if not audio_base64:
                logger.warning(f"{session_id}: Empty audio data received")
                return
            
            # Decode Base64 to get μ-law bytes
            ulaw_bytes = base64.b64decode(audio_base64)
            logger.info(f"{session_id}: Received {len(ulaw_bytes)} bytes μ-law audio")
            
            # Convert μ-law to WAV for processing
            wav_bytes = await self._convert_ulaw_to_wav(ulaw_bytes, session_id)
            if not wav_bytes:
                logger.error(f"{session_id}: Failed to convert μ-law to WAV")
                return
            
            # Process voice interaction
            if self.voice_service:
                response_text, audio_file_path = self.voice_service.process_voice_interaction(
                    wav_bytes, session_context
                )
                
                logger.info(f"{session_id}: Generated response: '{response_text}'")
                
                # Send audio response back to Maqsam
                if audio_file_path and os.path.exists(audio_file_path):
                    await self._send_audio_response(websocket, audio_file_path, session_id)
                    
                    # Clean up temporary file
                    try:
                        os.remove(audio_file_path)
                    except Exception as e:
                        logger.warning(f"{session_id}: Failed to clean up {audio_file_path}: {e}")
                else:
                    logger.error(f"{session_id}: No audio response generated")
                    await self._send_error_response(websocket, "No audio response")
            else:
                logger.error(f"{session_id}: Voice service not available")
                await self._send_error_response(websocket, "Voice service unavailable")
                
        except Exception as e:
            logger.error(f"{session_id}: Error handling audio input: {e}")
            await self._send_error_response(websocket, "Audio processing error")
    
    async def _handle_dtmf_input(self, data: Dict[str, Any], session_id: str, session_context: Dict[str, Any]):
        """
        Handle DTMF (touch-tone) input from caller
        """
        digit = data.get("data", {}).get("digit", "")
        logger.info(f"{session_id}: DTMF input received: {digit}")
        
        # Update session context with DTMF input
        if "dtmf_inputs" not in session_context:
            session_context["dtmf_inputs"] = []
        session_context["dtmf_inputs"].append(digit)
        
        # You can add logic here to handle DTMF-based menu navigation
        # For example, in healthcare context: "Press 1 for symptoms, 2 for appointments..."
    
    async def _handle_call_mark(self, data: Dict[str, Any], session_id: str):
        """
        Handle call.mark events for tracking audio playback completion
        """
        label = data.get("data", {}).get("label", "")
        logger.info(f"{session_id}: Call mark reached: {label}")
        
        # This indicates that audio up to this mark has been played to the caller
        # Useful for tracking conversation flow and handling interruptions
    
    async def _convert_ulaw_to_wav(self, ulaw_bytes: bytes, session_id: str) -> Optional[bytes]:
        """
        Convert μ-law audio (8000 Hz) to WAV (16000 Hz) for voice processing
        Uses FFmpeg for format conversion
        """
        try:
            import subprocess
            import tempfile
            
            # Check if ffmpeg is available
            ffmpeg_paths = [
                r"C:\Users\Ahmad Younis\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin\ffmpeg.exe",
                "ffmpeg.exe"
            ]
            
            ffmpeg_cmd = None
            for path in ffmpeg_paths:
                try:
                    result = subprocess.run([path, '-version'], capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        ffmpeg_cmd = path
                        break
                except:
                    continue
            
            if not ffmpeg_cmd:
                logger.error(f"{session_id}: FFmpeg not found for μ-law conversion")
                return None
            
            # Convert μ-law to WAV using FFmpeg pipes
            cmd = [
                ffmpeg_cmd,
                '-y',
                '-f', 'mulaw',
                '-ar', '8000',
                '-ac', '1',
                '-i', 'pipe:0',
                '-f', 'wav',
                '-acodec', 'pcm_s16le',
                '-ar', '16000',
                '-ac', '1',
                'pipe:1'
            ]
            
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0
            )
            
            stdout, stderr = process.communicate(
                input=ulaw_bytes,
                timeout=30
            )
            
            if process.returncode != 0:
                logger.error(f"{session_id}: μ-law to WAV conversion failed: {stderr.decode()}")
                return None
            
            logger.info(f"{session_id}: μ-law → WAV conversion successful: {len(stdout)} bytes")
            return stdout
            
        except Exception as e:
            logger.error(f"{session_id}: Error converting μ-law to WAV: {e}")
            return None
    
    async def _convert_wav_to_ulaw(self, wav_bytes: bytes, session_id: str) -> Optional[bytes]:
        """
        Convert WAV audio (16000 Hz) to μ-law (8000 Hz) for Maqsam
        """
        try:
            import subprocess
            
            ffmpeg_paths = [
                r"C:\Users\Ahmad Younis\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0-full_build\bin\ffmpeg.exe",
                "ffmpeg.exe"
            ]
            
            ffmpeg_cmd = None
            for path in ffmpeg_paths:
                try:
                    result = subprocess.run([path, '-version'], capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        ffmpeg_cmd = path
                        break
                except:
                    continue
            
            if not ffmpeg_cmd:
                logger.error(f"{session_id}: FFmpeg not found for WAV to μ-law conversion")
                return None
            
            # Convert WAV to μ-law
            cmd = [
                ffmpeg_cmd,
                '-y',
                '-f', 'wav',
                '-ar', '16000',
                '-ac', '1',
                '-i', 'pipe:0',
                '-f', 'mulaw',
                '-ar', '8000',
                '-ac', '1',
                'pipe:1'
            ]
            
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0
            )
            
            stdout, stderr = process.communicate(
                input=wav_bytes,
                timeout=30
            )
            
            if process.returncode != 0:
                logger.error(f"{session_id}: WAV to μ-law conversion failed: {stderr.decode()}")
                return None
            
            logger.info(f"{session_id}: WAV → μ-law conversion successful: {len(stdout)} bytes")
            return stdout
            
        except Exception as e:
            logger.error(f"{session_id}: Error converting WAV to μ-law: {e}")
            return None
    
    async def _send_audio_response(self, websocket: WebSocket, audio_file_path: str, session_id: str):
        """
        Send audio response to Maqsam in the correct format
        """
        try:
            # Read the WAV file
            with open(audio_file_path, "rb") as f:
                wav_bytes = f.read()
            
            # Convert WAV to μ-law
            ulaw_bytes = await self._convert_wav_to_ulaw(wav_bytes, session_id)
            if not ulaw_bytes:
                logger.error(f"{session_id}: Failed to convert response audio to μ-law")
                return
            
            # Encode to Base64
            audio_base64 = base64.b64encode(ulaw_bytes).decode('utf-8')
            
            # Send response.stream message
            response_message = {
                "type": "response.stream",
                "data": {
                    "audio": audio_base64
                }
            }
            
            await websocket.send_text(json.dumps(response_message))
            logger.info(f"{session_id}: Sent audio response ({len(ulaw_bytes)} bytes μ-law)")
            
        except Exception as e:
            logger.error(f"{session_id}: Error sending audio response: {e}")
    
    async def _send_error_response(self, websocket: WebSocket, error_message: str):
        """
        Send error response to Maqsam
        """
        error_response = {
            "type": "error",
            "data": {
                "message": error_message
            }
        }
        
        try:
            await websocket.send_text(json.dumps(error_response))
        except Exception as e:
            logger.error(f"Failed to send error response: {e}")
    
    async def send_speech_started(self, websocket: WebSocket, session_id: str):
        """
        Send speech.started message when customer interrupts
        """
        message = {
            "type": "speech.started"
        }
        
        try:
            await websocket.send_text(json.dumps(message))
            logger.info(f"{session_id}: Sent speech.started (customer interruption)")
        except Exception as e:
            logger.error(f"{session_id}: Failed to send speech.started: {e}")
    
    async def send_call_redirect(self, websocket: WebSocket, session_id: str):
        """
        Send call.redirect to transfer to human agent
        """
        message = {
            "type": "call.redirect"
        }
        
        try:
            await websocket.send_text(json.dumps(message))
            logger.info(f"{session_id}: Sent call.redirect (transfer to human agent)")
        except Exception as e:
            logger.error(f"{session_id}: Failed to send call.redirect: {e}")
    
    async def send_call_mark(self, websocket: WebSocket, session_id: str, label: str):
        """
        Send call.mark for tracking audio playback
        """
        message = {
            "type": "call.mark",
            "data": {
                "label": label
            }
        }
        
        try:
            await websocket.send_text(json.dumps(message))
            logger.info(f"{session_id}: Sent call.mark: {label}")
        except Exception as e:
            logger.error(f"{session_id}: Failed to send call.mark: {e}")
    
    async def send_call_hangup(self, websocket: WebSocket, session_id: str):
        """
        Send call.hangup to end the call gracefully
        """
        message = {
            "type": "call.hangup"
        }
        
        try:
            await websocket.send_text(json.dumps(message))
            logger.info(f"{session_id}: Sent call.hangup")
        except Exception as e:
            logger.error(f"{session_id}: Failed to send call.hangup: {e}")
    
    def get_active_sessions(self) -> Dict[str, Any]:
        """
        Get information about active Maqsam sessions
        """
        active_count = len([s for s in self.active_sessions.values() if s.get("active", False)])
        
        return {
            "active_sessions": active_count,
            "total_sessions": len(self.active_sessions),
            "sessions": self.active_sessions
        }
    
    def _normalize_arabic_response(
        self, 
        response_text: str, 
        question_type: str = "yes_no"
    ) -> Tuple[str, Optional[int]]:
        """
        Convert Arabic response to normalized text + numeric value
        
        Numeric Encoding:
        - Yes (نعم) = 1
        - No (لا) = 0
        - Uncertain (غير متأكد) = 3
        - Invalid/No response = None
        
        Returns: (normalized_text, numeric_value)
        """
        normalized = response_text.strip().lower()
        
        if question_type == "yes_no":
            # Yes responses (1)
            yes_patterns = ['نعم', 'اي', 'ايوه', 'yes', 'موافق', 'صحيح', 'اكيد', 'طبعا']
            if any(pattern in normalized for pattern in yes_patterns):
                return "نعم", 1
            
            # No responses (0)
            no_patterns = ['لا', 'no', 'غير موافق', 'خطأ', 'ابدا', 'مستحيل']
            if any(pattern in normalized for pattern in no_patterns):
                return "لا", 0
            
            # Uncertain responses (3)
            uncertain_patterns = ['غير متأكد', 'لا اعرف', 'uncertain', 'maybe', 'ربما', 'مش متأكد', 'مش عارف']
            if any(pattern in normalized for pattern in uncertain_patterns):
                return "غير متأكد", 3
        
        elif question_type == "rating":
            # Rating scale 1-5
            import re
            numbers = re.findall(r'\d+', normalized)
            if numbers:
                rating = int(numbers[0])
                if 1 <= rating <= 5:
                    return str(rating), rating
        
        # Invalid/unclear response
        logger.warning(f"Could not normalize response: '{response_text}'")
        return response_text, None
    
    async def _track_survey_response(
        self, 
        session_id: str, 
        session_context: Dict[str, Any],
        response_text: str
    ):
        """
        Track individual question responses during the call with numeric encoding
        """
        try:
            # Get current question from context
            current_question = session_context.get("current_question", {})
            question_id = current_question.get("id")
            question_order = current_question.get("order", 0)
            question_type = current_question.get("type", "yes_no")
            
            if not question_id:
                logger.warning(f"{session_id}: No current question to track response")
                return
            
            # Initialize responses list if needed
            if "collected_responses" not in session_context:
                session_context["collected_responses"] = []
            
            # Calculate confidence score (from STT)
            confidence = session_context.get("last_stt_confidence", 0.8)
            
            # Normalize response to get numeric value
            normalized_text, numeric_value = self._normalize_arabic_response(
                response_text, 
                question_type
            )
            
            # Record response with both text and numeric value
            response_entry = {
                "question_id": question_id,
                "question_order": question_order,
                "response_text": normalized_text,      # Normalized Arabic text
                "response_value": numeric_value,       # Numeric: 1/0/3 or 1-5 for ratings
                "confidence": confidence,
                "response_time_seconds": time.time() - session_context.get("question_start_time", time.time()),
                "timestamp": time.time()
            }
            
            session_context["collected_responses"].append(response_entry)
            
            logger.info(f"{session_id}: Tracked response for Q{question_order}: "
                       f"'{normalized_text}' (value: {numeric_value}, confidence: {confidence})")
            
        except Exception as e:
            logger.error(f"{session_id}: Error tracking response: {e}")
    
    def _is_survey_complete(self, session_context: Dict[str, Any]) -> bool:
        """
        Check if all survey questions have been answered
        """
        total_questions = session_context.get("total_questions", 0)
        collected_responses = session_context.get("collected_responses", [])
        
        return len(collected_responses) >= total_questions and total_questions > 0
    
    async def _submit_survey_responses(
        self, 
        session_id: str, 
        session_context: Dict[str, Any]
    ):
        """
        Submit collected survey responses to Next.js API
        """
        try:
            # Extract data from session context
            template_id = session_context.get("template_id")
            patient_id = session_context.get("patient_id")
            hospital_id = session_context.get("hospital_id")
            collected_responses = session_context.get("collected_responses", [])
            call_context = session_context.get("call_context", {})
            
            if not template_id or not hospital_id:
                logger.error(f"{session_id}: Missing template_id or hospital_id for submission")
                return
            
            # Sort responses by question_order
            sorted_responses = sorted(collected_responses, key=lambda x: x["question_order"])
            
            # Prepare API request
            payload = {
                "template_id": template_id,
                "question_count": session_context.get("total_questions", len(sorted_responses)),
                "answers": sorted_responses,
                "metadata": {
                    "session_id": session_id,
                    "patient_id": patient_id,
                    "hospital_id": hospital_id,
                    "campaign_id": session_context.get("campaign_id"),
                    "call_duration_seconds": int(time.time() - session_context.get("call_start_time", time.time())),
                    "voice_quality_score": session_context.get("voice_quality_score"),
                    "call_context": call_context
                }
            }
            
            # Generate JWT token for API authentication
            jwt_token = self._generate_service_jwt(hospital_id)
            
            # Submit to Next.js API
            api_url = f"{self.nextjs_api_url}/api/responses/submit"
            headers = {
                "Authorization": f"Bearer {jwt_token}",
                "Content-Type": "application/json"
            }
            
            logger.info(f"{session_id}: Submitting {len(sorted_responses)} responses to {api_url}")
            
            response = await self.http_client.post(
                api_url,
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"{session_id}: ✅ Survey responses submitted successfully! "
                           f"Response ID: {result.get('response_id')}, "
                           f"Completion rate: {result.get('completion_rate')}")
                
                # Mark as submitted in session
                session_context["responses_submitted"] = True
                session_context["submission_result"] = result
            else:
                logger.error(f"{session_id}: ❌ Failed to submit responses: {response.status_code} - {response.text}")
                
        except Exception as e:
            logger.error(f"{session_id}: Error submitting survey responses: {e}")
    
    def _generate_service_jwt(self, hospital_id: str) -> str:
        """
        Generate JWT token for service-to-service authentication
        """
        if not self.api_secret:
            logger.warning("VOICE_SERVICE_SECRET not set, using empty secret (INSECURE!)")
        
        payload = {
            "hospital_id": hospital_id,
            "role": "voice_service",
            "exp": datetime.utcnow() + timedelta(minutes=5),
            "iat": datetime.utcnow()
        }
        
        return jwt.encode(payload, self.api_secret, algorithm="HS256")
