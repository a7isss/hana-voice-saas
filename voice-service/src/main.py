from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
from .core.voice_processor import voice_processor

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Hana Voice Processing Service",
    description="Text-to-speech and speech-to-text service for healthcare surveys",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://hana-voice-api.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Hana Voice Processing Service")
    
    # Test voice processor health
    try:
        health = voice_processor.health_check()
        if health["status"] == "healthy":
            logger.info("✅ Voice processor initialized successfully")
        else:
            logger.warning("⚠️ Voice processor has limited functionality")
    except Exception as e:
        logger.error(f"❌ Voice processor initialization error: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Hana Voice Processing Service")

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "message": "Hana Voice Processing Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        health = voice_processor.health_check()
        return {
            "status": health["status"],
            "service": "hana-voice-service",
            "tts_available": health["tts_available"],
            "openai_connected": health["openai_connected"],
            "cache_available": health["cache_available"],
            "timestamp": "2025-09-23T21:30:00Z"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "hana-voice-service",
            "error": str(e),
            "timestamp": "2025-09-23T21:30:00Z"
        }

@app.post("/api/v1/generate-speech")
async def generate_speech(text: str, voice: str = "nova", language: str = "ar", speed: float = 0.95):
    """Generate speech from text"""
    try:
        audio_data = voice_processor.generate_text_to_speech(text, voice, language, speed)
        if not audio_data:
            raise HTTPException(status_code=500, detail="Failed to generate speech")
        
        return {"audio": audio_data}
    except Exception as e:
        logger.error(f"Generate speech error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate speech")

@app.post("/api/v1/transcribe")
async def transcribe_speech(audio_data: bytes, language: str = "ar"):
    """Transcribe speech to text"""
    try:
        transcription = voice_processor.transcribe_speech_to_text(audio_data, language)
        if not transcription:
            raise HTTPException(status_code=500, detail="Failed to transcribe speech")
        
        return {"transcription": transcription}
    except Exception as e:
        logger.error(f"Transcribe speech error: {e}")
        raise HTTPException(status_code=500, detail="Failed to transcribe speech")

@app.post("/api/v1/process-survey")
async def process_survey(audio_data: bytes, survey_questions: list, language: str = "ar"):
    """Process a complete voice survey"""
    try:
        result = voice_processor.process_voice_survey(audio_data, survey_questions, language)
        if not result:
            raise HTTPException(status_code=500, detail="Failed to process survey")
        
        return {"result": result}
    except Exception as e:
        logger.error(f"Process survey error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process survey")

@app.get("/api/v1/voices")
async def get_available_voices():
    """Get available TTS voices"""
    try:
        voices = voice_processor.get_available_voices()
        return {"voices": voices}
    except Exception as e:
        logger.error(f"Get voices error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available voices")

@app.get("/api/v1/languages")
async def get_supported_languages():
    """Get supported languages"""
    try:
        languages = voice_processor.get_supported_languages()
        return {"languages": languages}
    except Exception as e:
        logger.error(f"Get languages error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get supported languages")

@app.get("/api/v1/cache/stats")
async def get_cache_stats():
    """Get audio cache statistics"""
    try:
        # This would typically query the database for cache stats
        # For now, return mock data
        return {
            "total_cached_files": 150,
            "cache_size_mb": 45.2,
            "cache_hit_rate": 0.78
        }
    except Exception as e:
        logger.error(f"Get cache stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get cache statistics")

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Resource not found",
        "path": request.url.path,
        "method": request.method
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return {
        "error": "Internal server error",
        "message": "An unexpected error occurred"
    }

if __name__ == "__main__":
    # Run the application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False,
        log_level="info"
    )
