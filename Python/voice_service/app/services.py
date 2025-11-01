# app/services.py - Voice Service Core Logic
# Handles model loading and voice processing operations

import os
import json
import logging
import time
from typing import Optional, Tuple, Dict, Any
from vosk import Model, KaldiRecognizer
from TTS.api import TTS

logger = logging.getLogger(__name__)

class VoiceServiceError(Exception):
    """Custom exception for voice service errors"""
    pass

class ModelLoadError(VoiceServiceError):
    """Exception raised when models fail to load"""
    pass

class ProcessingError(VoiceServiceError):
    """Exception raised when voice processing fails"""
    pass

class VoiceService:
    """Self-hosted voice processing service using Coqui XTTS and Vosk Arabic"""

    def __init__(self):
        logger.info("Initializing Voice Service with Coqui XTTS and Vosk...")
        self._load_models()
        self.model_health = {
            "vosk_arabic": False,
            "coqui_xtts": False,
            "last_check": time.time()
        }
        self._check_model_health()

    def _load_models(self):
        """Load both TTS and STT models with retry logic and persistent disk support"""
        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                # Vosk Arabic STT Model - Check persistent disk first, then local
                persistent_stt_path = "/data/models/stt/vosk-model-ar-0.22-linto-1.1.0"
                local_stt_path = "models/vosk-model-ar-0.22-linto-1.1.0"

                vosk_path = persistent_stt_path if os.path.exists(persistent_stt_path) else local_stt_path

                if not os.path.exists(vosk_path):
                    raise FileNotFoundError(f"Vosk Arabic model not found at {vosk_path} (checked both persistent and local paths)")

                logger.info(f"Loading Vosk model from: {vosk_path} (attempt {attempt + 1}/{max_retries})")
                self.vosk_model = Model(vosk_path)
                logger.info("✅ Vosk Arabic model loaded successfully")

                # Coqui XTTS Model - Check persistent disk first, then download
                persistent_tts_path = "/data/models/tts/tts_models--multilingual--multi-dataset--xtts_v2"
                local_tts_path = "models/tts/tts_models--multilingual--multi-dataset--xtts_v2"

                if os.path.exists(persistent_tts_path):
                    # Use pre-deployed model from persistent disk
                    logger.info(f"Loading Coqui XTTS model from persistent disk: {persistent_tts_path} (attempt {attempt + 1}/{max_retries})")
                    self.tts_model = TTS(model_path=persistent_tts_path, config_path=os.path.join(persistent_tts_path, "config.json"), gpu=False)
                elif os.path.exists(local_tts_path):
                    # Use local pre-downloaded model
                    logger.info(f"Loading Coqui XTTS model from local cache: {local_tts_path} (attempt {attempt + 1}/{max_retries})")
                    self.tts_model = TTS(model_path=local_tts_path, config_path=os.path.join(local_tts_path, "config.json"), gpu=False)
                else:
                    # Download model (fallback for development)
                    logger.info(f"Downloading Coqui XTTS model (fallback)... (attempt {attempt + 1}/{max_retries})")
                    self.tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)

                logger.info("✅ Coqui XTTS model loaded successfully")
                logger.info("🎯 Voice Service initialization complete!")
                return

            except Exception as e:
                logger.error(f"Failed to load voice models (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    raise ModelLoadError(f"Voice model loading failed after {max_retries} attempts: {e}")

    def _check_model_health(self) -> Dict[str, bool]:
        """Check if models are healthy and responsive"""
        try:
            # Test Vosk model
            try:
                test_recognizer = KaldiRecognizer(self.vosk_model, 16000)
                self.model_health["vosk_arabic"] = True
            except Exception as e:
                logger.error(f"Vosk model health check failed: {e}")
                self.model_health["vosk_arabic"] = False

            # Test TTS model
            try:
                # Quick test synthesis with default speaker
                test_output = os.path.join(os.getcwd(), "health_check_test.wav")

                # Try to get available speakers first
                try:
                    speakers = self.tts_model.speakers
                    if speakers and len(speakers) > 0:
                        speaker = speakers[0]  # Use first available speaker
                        logger.info(f"Using TTS speaker: {speaker}")
                    else:
                        speaker = None
                except:
                    speaker = None

                self.tts_model.tts_to_file(
                    text="اختبار",
                    file_path=test_output,
                    language="ar",
                    speaker_wav=None,
                    speaker=speaker
                )

                if os.path.exists(test_output):
                    os.remove(test_output)
                    self.model_health["coqui_xtts"] = True
                else:
                    self.model_health["coqui_xtts"] = False
            except Exception as e:
                logger.error(f"TTS model health check failed: {e}")
                self.model_health["coqui_xtts"] = False

            self.model_health["last_check"] = time.time()
            logger.info(f"Model health check: {self.model_health}")
            return self.model_health

        except Exception as e:
            logger.error(f"Model health check failed: {e}")
            self.model_health["vosk_arabic"] = False
            self.model_health["coqui_xtts"] = False
            return self.model_health

    def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status of the voice service"""
        health = self._check_model_health()
        return {
            "status": "healthy" if all(health.values()) else "degraded",
            "models": health,
            "timestamp": time.time(),
            "version": "1.0.0"
        }

    # Model loading is handled in the constructor with retry logic - no duplicate method needed

    def speech_to_text(self, audio_bytes: bytes) -> str:
        """Convert audio bytes to Arabic text using Vosk with retry logic

        Args:
            audio_bytes: Raw PCM audio data (16-bit, mono, 16kHz expected)

        Returns:
            Transcribed Arabic text
        """
        max_retries = 2
        retry_delay = 0.5

        for attempt in range(max_retries):
            try:
                # Validate input
                if not audio_bytes or len(audio_bytes) < 100:
                    logger.warning(f"STT: Invalid audio data (size: {len(audio_bytes) if audio_bytes else 0})")
                    return ""

                # Check model health before processing
                if not self.model_health.get("vosk_arabic", False):
                    logger.warning("STT: Vosk model not healthy, attempting to reinitialize...")
                    self._check_model_health()
                    if not self.model_health.get("vosk_arabic", False):
                        raise ProcessingError("Vosk model is not available")

                # Create recognizer for this session
                recognizer = KaldiRecognizer(self.vosk_model, 16000)
                recognizer.SetWords(True)

                # Process audio in chunks (streaming)
                chunk_size = 4000
                audio_data = memoryview(audio_bytes)

                for i in range(0, len(audio_data), chunk_size):
                    chunk = audio_data[i:i+chunk_size]
                    if not recognizer.AcceptWaveform(bytes(chunk)):
                        logger.debug(f"STT: Partial result processing chunk {i//chunk_size + 1}")

                # Get final result
                final_result = json.loads(recognizer.FinalResult())
                text = final_result.get("text", "").strip()

                if text:
                    logger.info(f"🎤 STT: '{text}' (attempt {attempt + 1})")
                    return text
                else:
                    logger.debug(f"🎤 STT: No speech detected (attempt {attempt + 1})")
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        continue
                    return ""

            except json.JSONDecodeError as e:
                logger.warning(f"STT: JSON decode error (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    continue
                return ""
            except Exception as e:
                logger.error(f"STT: Speech-to-text processing failed (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    continue
                return ""

        return ""

    def text_to_speech(self, text: str, language: str = "ar",
                      output_filename: str = "response.wav") -> Optional[str]:
        """Convert Arabic text to speech using Coqui XTTS with retry logic

        Args:
            text: Arabic text to synthesize
            language: Language code (default: "ar" for Arabic)
            output_filename: Output WAV filename

        Returns:
            Path to generated audio file, or None if failed
        """
        max_retries = 2
        retry_delay = 1.0

        for attempt in range(max_retries):
            try:
                # Validate input
                if not text.strip():
                    logger.warning("TTS: Empty text provided")
                    return None

                # Check model health before processing
                if not self.model_health.get("coqui_xtts", False):
                    logger.warning("TTS: Coqui model not healthy, attempting to reinitialize...")
                    self._check_model_health()
                    if not self.model_health.get("coqui_xtts", False):
                        raise ProcessingError("Coqui TTS model is not available")

                # Sanitize filename
                safe_filename = "".join(c for c in output_filename if c.isalnum() or c in "._-").strip()
                if not safe_filename.endswith('.wav'):
                    safe_filename += '.wav'

                output_path = os.path.join(os.getcwd(), safe_filename)

                logger.info(f"🔊 TTS: Generating audio for '{text[:50]}...' (attempt {attempt + 1})")

                # Generate speech with timeout protection
                start_time = time.time()

                # Try to get available speakers first
                try:
                    speakers = self.tts_model.speakers
                    if speakers and len(speakers) > 0:
                        speaker = speakers[0]  # Use first available speaker
                    else:
                        speaker = None
                except:
                    speaker = None

                self.tts_model.tts_to_file(
                    text=text,
                    file_path=output_path,
                    language=language,
                    speaker_wav=None,
                    speaker=speaker
                )
                generation_time = time.time() - start_time

                # Verify file was created and has reasonable size
                if os.path.exists(output_path):
                    file_size = os.path.getsize(output_path)
                    if file_size > 1000:  # At least 1KB for valid audio
                        logger.info(f"✅ TTS: Audio generated successfully: {output_path}")
                        logger.debug(f"   File size: {file_size} bytes, Generation time: {generation_time:.2f}s")
                        return output_path
                    else:
                        logger.warning(f"TTS: Generated file too small ({file_size} bytes), retrying...")
                        if os.path.exists(output_path):
                            os.remove(output_path)
                else:
                    logger.warning(f"TTS: Output file not created: {output_path}")

                # Retry if failed
                if attempt < max_retries - 1:
                    logger.info(f"TTS: Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 1.5  # Progressive delay
                    continue
                else:
                    logger.error(f"❌ TTS: Failed to generate audio after {max_retries} attempts")
                    return None

            except Exception as e:
                logger.error(f"TTS: Text-to-speech processing failed (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 1.5
                    continue
                return None

        return None

    def process_voice_interaction(self, input_audio: bytes,
                                questionnaire_context: dict = None) -> Tuple[str, Optional[str]]:
        """Complete voice processing pipeline: STT → Logic → TTS

        Args:
            input_audio: Raw audio bytes from client
            questionnaire_context: Context for questionnaire logic

        Returns:
            Tuple of (response_text, audio_file_path)
        """
        try:
            # Step 1: Speech to Text
            user_text = self.speech_to_text(input_audio)

            if not user_text:
                # No speech detected
                response_text = "لم أسمع شيئاً بوضوح. هل يمكنك التكلم مرة أخرى؟"
            else:
                # Step 2: Process questionnaire logic (replace old JSON-to-voice system)
                response_text = self._process_questionnaire_logic(user_text, questionnaire_context)

            # Step 3: Text to Speech
            audio_file = self.text_to_speech(response_text)
            session_id = questionnaire_context.get("session_id", "unknown") if questionnaire_context else "unknown"

            logger.info(f"🔄 Session {session_id}: Voice interaction processed")

            return response_text, audio_file

        except Exception as e:
            logger.error(f"Voice interaction processing failed: {e}")
            error_response = "عذراً، حدث خطأ تقني. يرجى المحاولة مرة أخرى."
            error_audio = self.text_to_speech(error_response)
            return error_response, error_audio

    def _process_questionnaire_logic(self, user_text: str,
                                   context: dict = None) -> str:
        """Replace the old JSON-to-voice system with intelligent questionnaire logic

        This functions analyses Arabic healthcare input and provides appropriate responses.
        Replaces the rigid JSON processing with natural language understanding.

        Args:
            user_text: Arabic speech transcription
            context: Session context with current question state

        Returns:
            Appropriate Arabic response for the healthcare questionnaire
        """

        # Healthcare keyword patterns in Arabic
        pain_keywords = ["ألم", "وجع", "أعاني من ألم", "أتألم", "dolor", "pain"]
        medicine_keywords = ["دواء", "أدوية", "أتناول", "دواء", "medicine", "medication"]
        symptom_keywords = ["أعراض", "مشكلة", "مشاكل", "symptoms", "problems"]
        appointment_keywords = ["موعد", "زيارة", "طبيب", "appointment", "doctor"]
        numbers_keywords = ["صفر", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة",
                           "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "zero", "one", "two"]

        user_text_lower = user_text.lower()

        # Pain assessment logic
        if any(keyword in user_text_lower for keyword in pain_keywords):
            return "درجة الألم من ٠ إلى ١٠؟ (٠ لا ألم و ١٠ ألم شديد)"

        # Medication inquiry
        elif any(keyword in user_text_lower for keyword in medicine_keywords):
            return "ما هي الأدوية التي تتناولها حالياً؟ يرجى ذكر الأسماء والجرعات إن أمكن"

        # General symptom assessment
        elif any(keyword in user_text_lower for keyword in symptom_keywords):
            return "يرجى وصف الأعراض التي تشعر بها بتفصيل أكثر لمساعدتك بشكل أفضل"

        # Appointment-related
        elif any(keyword in user_text_lower for keyword in appointment_keywords):
            return "هل تحتاج إلى جدولة موعد مع الطبيب؟ يمكنني مساعدتك في ذلك"

        # Number recognition for pain scale
        elif any(keyword in user_text_lower for keyword in numbers_keywords):
            # Extract numbers for pain scale validation
            for word in user_text_lower.split():
                if word in ["صفر", "zero"]:
                    return "فهمت، لا تشعر بأي ألم. شكراً لك. لديك أسئلة أخرى؟"
                elif word in ["واحد", "one", "اثنان", "two", "ثلاثة", "three"]:
                    return "فهمت درجة الألم الخفيفة. إذا استمرت الأعراض، يرجى استشارة الطبيب"
                elif word in ["أربعة", "four", "خمسة", "five", "six", "six"]:
                    return "درجة الألم متوسطة. يُنصح بزيارة الطبيب لتقييم الحالة"
                elif word in ["سبعة", "seven", "ثمانية", "eight", "تسعة", "nine", "عشرة", "ten"]:
                    return "ألم شديد. يرجى طلب المساعدة الطبية فوراً"

        # Default fallback responses
        elif len(user_text.split()) < 2:
            # Very short input
            return "يرجى التفصيل أكثر في إجابتك لمساعدتك بشكل أفضل"

        else:
            # Generic response for other inputs
            return "شكراً لمعلوماتك. هل يمكنك وصف حالتك الصحية بتفصيل أكثر؟"
