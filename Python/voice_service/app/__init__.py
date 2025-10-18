# app/__init__.py - Arabic Healthcare Voice Service Package
# FastAPI application for self-hosted Arabic voice processing

__version__ = "1.0.0"
__description__ = "Self-hosted Arabic healthcare voice processing service using Coqui XTTS and Vosk"

# Import main components for easy importing
from .main import app
from .services import VoiceService

__all__ = [
    "app",
    "VoiceService",
    "__version__",
    "__description__"
]
