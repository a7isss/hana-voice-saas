# Backend Overview (Python Voice Service)

The backend is a **Python FastAPI** service responsible for core voice processing capabilities, including Speech-to-Text (STT), Text-to-Speech (TTS), and Telephony integration.

## 📂 Directory Structure

-   `Python/voice_service/app/main.py`: Main application entry point and API endpoints.
-   `Python/voice_service/app/services`: Core logic for STT (Vosk) and TTS (Coqui).
-   `Python/voice_service/app/core`: Configuration and utilities.

## 🔌 API Endpoints

-   `POST /tts`: Generates audio from text.
    -   Body: `{ "text": "Hello", "language": "ar" }`
    -   Returns: `audio/wav` bytes.
-   `GET /health`: Checks service health and model status.
-   `WS /ws/call/{call_id}`: WebSocket endpoint for real-time audio streaming (Maqsam integration).

## 🤖 AI Models

-   **STT**: Vosk (Arabic model).
-   **TTS**: Coqui TTS (XTTS v2).

## 🚀 Development

```bash
cd Python/voice_service
pip install -r requirements.txt
python -m app.main
```
