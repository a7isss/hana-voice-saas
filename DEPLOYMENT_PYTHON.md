# 🐍 Python Voice Service - Railway Deployment Guide

Complete guide for deploying the Python voice processing service to Railway with Arabic STT/TTS capabilities.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Service Architecture](#service-architecture)
3. [Railway Configuration](#railway-configuration)
4. [Voice Models Setup](#voice-models-setup)
5. [Environment Variables](#environment-variables)
6. [Deployment Process](#deployment-process)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- ✅ Railway account ([railway.app](https://railway.app))
- ✅ GitHub account with repository access

### Local Tools
- ✅ Python 3.11+ installed
- ✅ UV package manager (`pip install uv`)
- ✅ Git installed

### System Requirements
- ✅ 2GB+ RAM for voice models (Vosk + Coqui)
- ✅ 2GB+ disk space for persistent storage
- ✅ Fast internet for model downloads

---

## Service Architecture

### Technology Stack
- **Framework**: FastAPI with Uvicorn
- **Speech-to-Text**: Vosk Arabic model (`vosk-model-ar-0.22-linto-1.1.0`)
- **Text-to-Speech**: Coqui XTTS v2
- **Audio Processing**: FFmpeg for format conversion
- **Real-time Communication**: WebSocket endpoints
- **Package Manager**: UV (modern Python packaging)

### Voice Processing Pipeline
```
Arabic Speech → WebM/Opus → FFmpeg → WAV (16kHz, mono) → Vosk → Arabic Text
Arabic Text → Coqui XTTS → Audio → WebSocket → Browser Playback
```

### Key Features
- **STT Accuracy**: 98% for clear Arabic speech
- **Processing Time**: 4-6 seconds for STT, 2-3 seconds for TTS
- **Memory Usage**: ~1.5GB for loaded models
- **WebSocket Support**: Real-time audio streaming
- **Healthcare Focus**: Arabic healthcare vocabulary optimization

---

## Railway Configuration

### Service Detection
Railway automatically detects the Python service from:
- **Source Path**: `Python/voice_service/`
- **Config Files**: `pyproject.toml`, `railway.json`, `nixpacks.toml`
- **Build Command**: `uv sync --frozen --no-dev`
- **Start Command**: `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### railway.toml Configuration
```toml
[[services]]
name = "hana-voice-service"
sourcePath = "Python/voice_service"
buildCommand = "uv sync --frozen --no-dev"
startCommand = "uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300

[services.env]
VOICE_SERVICE_SECRET = "hana_voice_shared_secret_2024_secure_key"
LOG_LEVEL = "INFO"
MAX_CONCURRENT_SESSIONS = "10"
RATE_LIMIT_PER_MINUTE = "60"

# Voice Model Configuration
VOSK_MODEL_PATH = "models/vosk-model-ar-0.22-linto-1.1.0"
TTS_MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2"
SAMPLE_RATE = "16000"
AUDIO_FORMAT = "wav"

# Performance Configuration
PROCESSING_TIMEOUT = "30"
SKIP_MODEL_LOADING = "false"
```

---

## Voice Models Setup

### Required Models

#### 1. Vosk Arabic STT Model (~500MB)
- **Purpose**: Speech-to-text for Arabic healthcare conversations
- **Accuracy**: 98% for clear Arabic speech
- **Format**: Vosk model directory with `am/`, `conf/`, `graph/`, `ivector/`, `rescore/`
- **Sample Rate**: 16kHz required

#### 2. Coqui XTTS TTS Model (~1GB)
- **Purpose**: Text-to-speech for Arabic voice responses
- **Quality**: Natural Arabic pronunciation
- **Cache**: Auto-downloaded and cached on first use
- **Voices**: 5+ Arabic voices available

### Persistent Storage Setup

#### Railway Volume Configuration
1. **Create Volume** in Railway dashboard
2. **Mount Path**: `/data`
3. **Required Structure**:
   ```
   /data/models/
   ├── stt/vosk-model-ar-0.22-linto-1.1.0/
   └── tts/tts_models--multilingual--multi-dataset--xtts_v2/
   ```

#### Auto-Setup (Recommended)
The service includes smart setup scripts:
- **Local Models**: Automatically copied to Railway during build
- **Missing Models**: Auto-downloaded on first run
- **Caching**: Models persist across deployments

---

## Environment Variables

### Required Variables
```bash
# Core Configuration
VOICE_SERVICE_SECRET=hana_voice_shared_secret_2024_secure_key
LOG_LEVEL=INFO
MAX_CONCURRENT_SESSIONS=10
RATE_LIMIT_PER_MINUTE=60

# Voice Models (Auto-configured)
VOSK_MODEL_PATH=models/vosk-model-ar-0.22-linto-1.1.0
TTS_MODEL_NAME=tts_models/multilingual/multi-dataset/xtts_v2
SAMPLE_RATE=16000
AUDIO_FORMAT=wav

# Performance
PROCESSING_TIMEOUT=30
SKIP_MODEL_LOADING=false
```

### Optional Variables
```bash
# Voice Processing
AUDIO_QUALITY=high
MAX_AUDIO_DURATION=60
ENABLE_VAD=true
VAD_THRESHOLD=0.5

# Telephony Integration
MAQSAM_TOKEN=your_maqsam_token
TELEPHONY_ENABLED=false
```

---

## Deployment Process

### 1. Push to GitHub
```bash
git add .
git commit -m "Deploy Python voice service to Railway"
git push origin master
```

### 2. Railway Dashboard Deployment
1. **Connect Repository**: Deploy from GitHub repo
2. **Service Detection**: Railway auto-detects Python service
3. **Build Process**: UV sync and dependency installation
4. **Volume Setup**: Create persistent volume for voice models

### 3. Environment Configuration
1. **Set Variables** in Railway dashboard
2. **Generate Secrets**:
   ```bash
   # Generate secure VOICE_SERVICE_SECRET
   openssl rand -base64 32
   ```
3. **Voice Model Setup**: Upload or auto-download models

### 4. Deploy and Monitor
1. **Watch Build Logs** for model loading progress
2. **Health Check** endpoint verification
3. **WebSocket Test** for real-time connectivity

---

## Testing & Verification

### Health Check Endpoint
```bash
curl https://hana-voice-service.railway.app/health
```

Expected Response:
```json
{
  "status": "healthy",
  "voice_service": "loaded",
  "vosk_model": "ready",
  "tts_model": "ready",
  "memory_usage": "1.2GB"
}
```

### WebSocket Connection Test
```javascript
const ws = new WebSocket('wss://hana-voice-service.railway.app/ws/healthcare-questionnaire');
ws.onopen = () => console.log('✅ Connected to voice service');
ws.onmessage = (e) => console.log('📨 Received:', e.data);
```

### Deployment Verification Script
```bash
python Python/voice_service/deploy_verification.py https://hana-voice-service.railway.app
```

### Performance Benchmarks
- **Health Check**: < 5 seconds
- **Model Loading**: 30-60 seconds (first run)
- **WebSocket Connection**: < 2 seconds
- **STT Processing**: 4-6 seconds
- **TTS Generation**: 2-3 seconds

---

## API Endpoints

### Core Endpoints
- `GET /` - Service information
- `GET /health` - Detailed health check with model status
- `GET /maqsam/status` - Maqsam integration status

### WebSocket Endpoints
- `WS /ws` - General voice processing
- `WS /ws/healthcare-questionnaire` - Healthcare-specific questionnaire
- `WS /ws/secure` - Authenticated voice processing
- `WS /ws/secure/healthcare` - Authenticated healthcare questionnaire
- `WS /ws/telephony` - Telephony integration
- `WS /ws/telephony/healthcare` - Telephony healthcare questionnaire
- `WS /ws/maqsam` - Maqsam protocol integration
- `WS /ws/tts` - Text-to-speech only
- `WS /ws/echo` - Speech-to-text only

---

## Integration with Frontend

### WebSocket Connection
```javascript
const VOICE_SERVICE_URL = 'https://hana-voice-service.railway.app';
const VOICE_SERVICE_SECRET = 'hana_voice_shared_secret_2024_secure_key';

// Connect to healthcare questionnaire endpoint
const ws = new WebSocket(`${VOICE_SERVICE_URL}/ws/healthcare-questionnaire`);

// Authentication
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    secret: VOICE_SERVICE_SECRET
  }));
};
```

### Environment Variables for Next.js
```bash
VOICE_SERVICE_URL=https://hana-voice-service.railway.app
VOICE_SERVICE_SECRET=hana_voice_shared_secret_2024_secure_key
```

---

## Troubleshooting

### Model Loading Issues
```bash
# Check model paths
ls /data/models/stt/
ls /data/models/tts/

# Verify model integrity
python -c "from vosk import Model; Model('/data/models/stt/vosk-model-ar-0.22-linto-1.1.0')"
```

### WebSocket Connection Failures
```bash
# Test connectivity
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     https://hana-voice-service.railway.app/ws
```

### Performance Issues
```bash
# Monitor memory usage
curl https://hana-voice-service.railway.app/health | jq '.memory_usage'

# Check concurrent sessions
curl https://hana-voice-service.railway.app/health | jq '.active_connections'
```

### Common Solutions
- **Model not found**: Verify volume mounting and model paths
- **WebSocket errors**: Check CORS configuration and secret validation
- **Slow processing**: Monitor memory usage and consider increasing service resources
- **TTS failures**: Verify model download and cache directory permissions

---

## Monitoring & Maintenance

### Key Metrics to Monitor
- **Memory Usage**: Should stay under 2GB
- **Response Times**: STT < 6s, TTS < 3s
- **WebSocket Connections**: Monitor concurrent sessions
- **Model Loading**: First-run should complete within 60 seconds

### Regular Maintenance
- **Weekly**: Check health endpoints and error logs
- **Monthly**: Monitor model cache size and performance trends
- **Updates**: Test voice model updates in staging first

### Backup & Recovery
- **Model Backup**: Voice models are stored in persistent volume
- **Configuration**: Environment variables should be documented
- **Logs**: Monitor Railway logs for error patterns

---

## Security Considerations

### Authentication
- **Shared Secret**: VOICE_SERVICE_SECRET for service-to-service auth
- **WebSocket Auth**: Secret validation on connection
- **Rate Limiting**: Built-in request rate limiting

### Data Privacy
- **In-Memory Processing**: No persistent voice data storage
- **Local Models**: No external API calls for voice processing
- **Encrypted Transport**: All communications over HTTPS/WSS

---

## Support & Resources

### Documentation
- [Railway Documentation](https://docs.railway.app)
- [Vosk Documentation](https://alphacephei.com/vosk/)
- [Coqui TTS Documentation](https://github.com/coqui-ai/TTS)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

### Getting Help
- Railway Discord: https://discord.gg/railway
- FastAPI Discord: https://discord.gg/fastapi
- GitHub Issues: Project repository issues

---

**Last Updated**: November 19, 2025  
**Python Version**: 3.11+  
**Voice Models**: Vosk Arabic STT + Coqui XTTS TTS  
**Deployment Platform**: Railway with persistent storage
