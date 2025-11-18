# Railway Deployment Guide - Hana Voice Service Backend

## Overview
This guide covers the deployment of the Python voice service backend to Railway for production-ready Arabic voice processing and telephony integration.

## Pre-Deployment Checklist

### ✅ Code Analysis Complete
- **Python Service Structure**: FastAPI application with WebSocket support
- **Dependencies**: UV-based package management (pyproject.toml, uv.lock)
- **Voice Models**: Vosk Arabic STT + Coqui XTTS TTS
- **Voice Models Size**: ~1.5GB total (Vosk: 500MB, TTS: 1GB)

### ✅ Railway Configuration Updated
- **Package Manager**: Changed from Poetry to UV
- **Build Command**: `uv sync --frozen --no-dev`
- **Start Command**: `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check**: `/health` endpoint configured

### ✅ Environment Variables Configured
```
VOICE_SERVICE_SECRET=hana_voice_shared_secret_2024_secure_key
LOG_LEVEL=INFO
MAX_CONCURRENT_SESSIONS=10
RATE_LIMIT_PER_MINUTE=60
VOSK_MODEL_PATH=models/vosk-model-ar-0.22-linto-1.1.0
TTS_MODEL_NAME=tts_models/multilingual/multi-dataset/xtts_v2
SAMPLE_RATE=16000
AUDIO_FORMAT=wav
PROCESSING_TIMEOUT=30
SKIP_MODEL_LOADING=false
```

## Railway Deployment Steps

### 1. Deploy to Railway
```bash
# Push changes to your repository
git add .
git commit -m "Configure Python voice service for Railway deployment"
git push origin main
```

### 2. Voice Models Persistence Setup
**CRITICAL**: Voice models require persistent storage on Railway.

#### Option A: Railway Volume (Recommended)
1. Create a Railway Volume in your project dashboard
2. Mount volume to `/data` directory
3. Upload voice models to the volume:
   - `models/vosk-model-ar-0.22-linto-1.1.0/` (500MB)
   - `models/tts/tts_models--multilingual--multi-dataset--xtts_v2/` (1GB)

#### Option B: Model Download (Slower)
- Service will auto-download TTS model on first run
- Vosk model must be pre-uploaded or the service will fail

### 3. Environment Variables Setup
Set the following in Railway dashboard > Variables:

#### Required Variables
- `VOICE_SERVICE_SECRET`: Secure shared secret (generate: `openssl rand -base64 32`)
- `LOG_LEVEL`: Set to `INFO` for production
- `MAX_CONCURRENT_SESSIONS`: Set to `10` (adjust based on plan)
- `VOSK_MODEL_PATH`: Path to Vosk model (typically `models/vosk-model-ar-0.22-linto-1.1.0`)
- `TTS_MODEL_NAME`: TTS model identifier

#### Optional Variables
- `MAQSAM_TOKEN`: Pre-shared token for Maqsam telephony integration
- `SAMPLE_RATE`: Audio sample rate (default: 16000)
- `PROCESSING_TIMEOUT`: Voice processing timeout (default: 30)

### 4. Service Configuration
The Python service will:
- Start on Railway's assigned port
- Load voice models on initialization
- Provide WebSocket endpoints for voice processing
- Include comprehensive health checks

## Endpoints Available

### Core Endpoints
- `GET /` - Basic service information
- `GET /health` - Detailed health check with model status
- `GET /maqsam/status` - Maqsam integration status

### WebSocket Endpoints
- `WS /ws` - General voice processing
- `WS /ws/healthcare-questionnaire` - Healthcare-specific questionnaire
- `WS /ws/secure` - Authenticated voice processing
- `WS /ws/secure/healthcare` - Authenticated healthcare questionnaire
- `WS /ws/telephony` - Telephony integration (requires token)
- `WS /ws/telephony/healthcare` - Telephony healthcare questionnaire
- `WS /ws/maqsam` - Maqsam protocol integration
- `WS /ws/maqsam/healthcare` - Maqsam healthcare questionnaire
- `WS /ws/tts` - Text-to-speech only
- `WS /ws/echo` - Speech-to-text only

## Testing Deployment

### 1. Basic Connectivity Test
```bash
curl -X GET https://your-voice-service.railway.app/health
```

### 2. Run Verification Script
```bash
python deploy_verification.py https://your-voice-service.railway.app
```

### 3. Test WebSocket Endpoints
Use the voice-tester script in the frontend to test WebSocket connectivity.

## Post-Deployment Verification

### Health Check Results
A successful deployment should show:
- ✅ Connectivity: Success
- ✅ Health: Success (voice_service: "loaded")
- ✅ Maqsam Status: Success/Partial
- ✅ Environment: Success (all variables set)
- ✅ Voice Models: Success (paths accessible)

### Expected Response Times
- Health check: < 5 seconds
- Voice model loading: 30-60 seconds (first run)
- WebSocket connections: < 2 seconds

## Monitoring & Troubleshooting

### Logs to Monitor
1. **Model Loading**: Watch for successful Vosk/TTS model initialization
2. **Memory Usage**: Voice models require ~2GB RAM
3. **WebSocket Connections**: Monitor connection stability
4. **Processing Times**: Track voice processing latency

### Common Issues

#### Model Loading Failures
- Check voice model paths in environment variables
- Verify persistent volume mounting
- Ensure models are uploaded correctly

#### WebSocket Connection Issues
- Check CORS configuration in main.py
- Verify health check endpoint returns 200
- Test with simple WebSocket client

#### Performance Issues
- Monitor memory usage (models require 2GB+)
- Check concurrent session limits
- Verify rate limiting configuration

## Integration with Frontend

### WebSocket URL Format
```
ws://your-voice-service.railway.app/ws
```

### Frontend Environment Variables
Update Next.js environment:
```bash
VOICE_SERVICE_URL=https://your-voice-service.railway.app
VOICE_SERVICE_SECRET=hana_voice_shared_secret_2024_secure_key
```

### Authentication
- Frontend must include `VOICE_SERVICE_SECRET` in WebSocket connection
- Service validates shared secret for security

## Success Metrics

### Deployment Success Criteria
- [ ] Service responds to health checks
- [ ] Voice models load successfully
- [ ] WebSocket endpoints accept connections
- [ ] No critical errors in logs
- [ ] Health check shows "healthy" status

### Performance Targets
- Health check response: < 5 seconds
- WebSocket connection: < 2 seconds
- Voice processing: < 10 seconds per interaction
- Memory usage: < 3GB total

## Maintenance

### Regular Tasks
1. Monitor health check endpoint
2. Review voice processing logs
3. Check memory usage trends
4. Update environment variables as needed

### Updates
- Models are persistent, won't need re-upload unless updated
- Code updates deploy automatically via Git
- Environment changes require manual updates in Railway dashboard

---

**Last Updated**: November 18, 2025  
**Deployment Version**: 1.0.0  
**Railway Configuration**: UV-based production deployment
