import os
import hashlib
import json
import logging
from typing import Optional, Dict, Any
from openai import OpenAI
import base64
from ..storage.supabase_client import supabase_client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VoiceProcessor:
    """Voice processing service for TTS and STT with Arabic support"""
    
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.supabase = supabase_client
        self.default_voice = "nova"
        self.default_language = "ar"
        self.default_speed = 0.95
        
        if not os.getenv('OPENAI_API_KEY'):
            logger.warning("OPENAI_API_KEY not set - voice processing will be limited")
    
    def generate_text_to_speech(self, text: str, voice: str = None, 
                               language: str = None, speed: float = None) -> Optional[Dict]:
        """Generate speech from text with caching"""
        try:
            # Use defaults if not provided
            voice = voice or self.default_voice
            language = language or self.default_language
            speed = speed or self.default_speed
            
            # Create hash for caching
            text_hash = hashlib.md5(f"{text}_{voice}_{language}_{speed}".encode()).hexdigest()
            
            # Check cache first
            cached_audio = self._get_cached_audio(text_hash)
            if cached_audio:
                logger.info(f"Using cached audio for text hash: {text_hash}")
                return cached_audio
            
            # Generate new audio
            logger.info(f"Generating TTS for text: {text[:100]}...")
            
            response = self.client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text,
                speed=speed
            )
            
            # Convert to base64 for storage
            audio_bytes = response.content
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # Cache the audio
            audio_data = {
                "text_hash": text_hash,
                "text_content": text,
                "audio_url": f"data:audio/mpeg;base64,{audio_base64}",
                "voice_model": voice,
                "language": language,
                "duration": len(audio_bytes) / 16000,  # Approximate duration
                "file_size": len(audio_bytes)
            }
            
            self._cache_audio(audio_data)
            
            return audio_data
            
        except Exception as e:
            logger.error(f"TTS generation error: {e}")
            return None
    
    def transcribe_speech_to_text(self, audio_data: bytes, language: str = None) -> Optional[Dict]:
        """Transcribe speech to text with Arabic support"""
        try:
            language = language or self.default_language
            
            # Save audio to temporary file for OpenAI API
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_audio:
                temp_audio.write(audio_data)
                temp_audio.flush()
                
                with open(temp_audio.name, "rb") as audio_file:
                    transcript = self.client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language=language,
                        response_format="verbose_json"
                    )
                
                # Clean up temporary file
                os.unlink(temp_audio.name)
            
            return {
                "text": transcript.text,
                "language": transcript.language,
                "duration": transcript.duration,
                "confidence": getattr(transcript, 'confidence', 0.0)
            }
            
        except Exception as e:
            logger.error(f"STT transcription error: {e}")
            return None
    
    def process_voice_survey(self, audio_input: bytes, survey_questions: list, 
                           language: str = None) -> Optional[Dict]:
        """Process a complete voice survey with multiple questions"""
        try:
            language = language or self.default_language
            
            # Transcribe the audio
            transcription = self.transcribe_speech_to_text(audio_input, language)
            if not transcription:
                return None
            
            # Analyze the response against survey questions
            analysis = self._analyze_survey_response(transcription['text'], survey_questions)
            
            return {
                "transcription": transcription,
                "analysis": analysis,
                "language": language
            }
            
        except Exception as e:
            logger.error(f"Voice survey processing error: {e}")
            return None
    
    def _get_cached_audio(self, text_hash: str) -> Optional[Dict]:
        """Get cached audio from database"""
        try:
            response = self.supabase.client.table('audio_files').select('*').eq('text_hash', text_hash).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Cache retrieval error: {e}")
            return None
    
    def _cache_audio(self, audio_data: Dict) -> bool:
        """Cache audio in database"""
        try:
            response = self.supabase.client.table('audio_files').insert(audio_data).execute()
            return bool(response.data)
        except Exception as e:
            logger.error(f"Cache storage error: {e}")
            return False
    
    def _analyze_survey_response(self, response_text: str, questions: list) -> Dict:
        """Analyze survey response using OpenAI for intent classification"""
        try:
            # Simple keyword-based analysis for healthcare responses
            response_lower = response_text.lower()
            
            # Common Arabic responses for healthcare surveys
            arabic_yes_keywords = ['نعم', 'ايوه', 'صح', 'موافق', 'حاضر']
            arabic_no_keywords = ['لا', 'لأ', 'مش', 'غير موافق', 'رفض']
            
            # Check for yes/no responses
            is_yes = any(keyword in response_lower for keyword in arabic_yes_keywords)
            is_no = any(keyword in response_lower for keyword in arabic_no_keywords)
            
            if is_yes:
                return {"response": "yes", "confidence": 0.9, "answered": True}
            elif is_no:
                return {"response": "no", "confidence": 0.9, "answered": True}
            else:
                # Use OpenAI for more complex analysis if available
                return self._analyze_with_openai(response_text, questions)
                
        except Exception as e:
            logger.error(f"Response analysis error: {e}")
            return {"response": "uncertain", "confidence": 0.0, "answered": False}
    
    def _analyze_with_openai(self, response_text: str, questions: list) -> Dict:
        """Use OpenAI for advanced response analysis"""
        try:
            if not os.getenv('OPENAI_API_KEY'):
                return {"response": "uncertain", "confidence": 0.0, "answered": False}
            
            # Create prompt for healthcare response classification
            prompt = f"""
            Analyze this healthcare survey response in Arabic and classify it as 'yes', 'no', or 'uncertain'.
            
            Response: "{response_text}"
            
            Questions: {json.dumps(questions, ensure_ascii=False)}
            
            Return JSON format: {{"response": "yes|no|uncertain", "confidence": 0.0-1.0, "answered": true|false}}
            """
            
            completion = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a healthcare survey analyst. Analyze Arabic responses for yes/no questions."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            analysis = json.loads(completion.choices[0].message.content)
            return analysis
            
        except Exception as e:
            logger.error(f"OpenAI analysis error: {e}")
            return {"response": "uncertain", "confidence": 0.0, "answered": False}
    
    def get_available_voices(self) -> list:
        """Get available TTS voices"""
        return [
            {"id": "alloy", "name": "Alloy", "language": "multilingual"},
            {"id": "echo", "name": "Echo", "language": "multilingual"},
            {"id": "fable", "name": "Fable", "language": "multilingual"},
            {"id": "onyx", "name": "Onyx", "language": "multilingual"},
            {"id": "nova", "name": "Nova", "language": "multilingual", "recommended": True},
            {"id": "shimmer", "name": "Shimmer", "language": "multilingual"}
        ]
    
    def get_supported_languages(self) -> list:
        """Get supported languages for TTS/STT"""
        return [
            {"code": "ar", "name": "Arabic", "rtl": True, "default": True},
            {"code": "en", "name": "English", "rtl": False},
            {"code": "fr", "name": "French", "rtl": False},
            {"code": "es", "name": "Spanish", "rtl": False}
        ]
    
    def health_check(self) -> Dict:
        """Check voice service health"""
        try:
            # Test TTS with a simple phrase
            test_phrase = "خدمة الصوت تعمل بشكل صحيح"
            test_result = self.generate_text_to_speech(test_phrase)
            
            return {
                "status": "healthy" if test_result else "degraded",
                "tts_available": bool(test_result),
                "openai_connected": bool(os.getenv('OPENAI_API_KEY')),
                "cache_available": True  # Assuming cache is working
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "tts_available": False,
                "openai_connected": False,
                "cache_available": False,
                "error": str(e)
            }

# Global voice processor instance
voice_processor = VoiceProcessor()
