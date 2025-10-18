# app/services.py - Voice Service Core Logic
# Handles model loading and voice processing operations

import os
import json
import logging
from typing import Optional, Tuple
from vosk import Model, KaldiRecognizer
from TTS.api import TTS

logger = logging.getLogger(__name__)

class VoiceService:
    """Self-hosted voice processing service using Coqui XTTS and Vosk Arabic"""

    def __init__(self):
        logger.info("Initializing Voice Service with Coqui XTTS and Vosk...")
        self._load_models()

    def _load_models(self):
        """Load both TTS and STT models"""
        try:
            # Vosk Arabic STT Model
            vosk_path = os.environ.get("VOSK_MODEL_PATH", "models/vosk-model-ar-0.22")
            if not os.path.exists(vosk_path):
                raise FileNotFoundError(f"Vosk Arabic model not found at {vosk_path}")

            logger.info(f"Loading Vosk model from: {vosk_path}")
            self.vosk_model = Model(vosk_path)
            logger.info("✅ Vosk Arabic model loaded successfully")

            # Coqui XTTS Model (Multi-language with Arabic)
            logger.info("Loading Coqui XTTS model...")
            self.tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
            logger.info("✅ Coqui XTTS model loaded successfully")

            logger.info("🎯 Voice Service initialization complete!")

        except Exception as e:
            logger.error(f"Failed to load voice models: {e}")
            raise RuntimeError(f"Voice model loading failed: {e}")

    def speech_to_text(self, audio_bytes: bytes) -> str:
        """Convert audio bytes to Arabic text using Vosk

        Args:
            audio_bytes: Raw PCM audio data (16-bit, mono, 16kHz expected)

        Returns:
            Transcribed Arabic text
        """
        try:
            # Create recognizer for this session
            recognizer = KaldiRecognizer(self.vosk_model, 16000)
            recognizer.SetWords(True)

            # Process audio in chunks (streaming)
            chunk_size = 4000
            audio_data = memoryview(audio_bytes)

            for i in range(0, len(audio_data), chunk_size):
                chunk = audio_data[i:i+chunk_size]
                recognizer.AcceptWaveform(bytes(chunk))

            # Get final result
            final_result = json.loads(recognizer.FinalResult())
            text = final_result.get("text", "").strip()

            if text:
                logger.info(f"🎤 STT: '{text}'")
            else:
                logger.debug("🎤 STT: No speech detected")

            return text

        except Exception as e:
            logger.error(f"Speech-to-text processing failed: {e}")
            return ""

    def text_to_speech(self, text: str, language: str = "ar",
                      output_filename: str = "response.wav") -> Optional[str]:
        """Convert Arabic text to speech using Coqui XTTS

        Args:
            text: Arabic text to synthesize
            language: Language code (default: "ar" for Arabic)
            output_filename: Output WAV filename

        Returns:
            Path to generated audio file, or None if failed
        """
        try:
            if not text.strip():
                logger.warning("TTS: Empty text provided")
                return None

            # Sanitize filename
            safe_filename = "".join(c for c in output_filename if c.isalnum() or c in "._-").strip()
            if not safe_filename.endswith('.wav'):
                safe_filename += '.wav'

            output_path = os.path.join(os.getcwd(), safe_filename)

            logger.info(f"🔊 TTS: Generating audio for '{text[:50]}...'")

            # Generate speech
            self.tts_model.tts_to_file(
                text=text,
                file_path=output_path,
                language=language
            )

            # Verify file was created
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                logger.info(f"✅ TTS: Audio generated successfully: {output_path}")
                logger.debug(f"   File size: {os.path.getsize(output_path)} bytes")
                return output_path
            else:
                logger.error("❌ TTS: Generated file is empty or missing")
                return None

        except Exception as e:
            logger.error(f"Text-to-speech processing failed: {e}")
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
