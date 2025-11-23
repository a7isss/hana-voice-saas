# 🔍 Voice Service Cloud Verification Checklist

*Comprehensive testing guide for Hana Voice SaaS deployment on Railway*

## Current Deployment Status ⚠️ UNDER INVESTIGATION
- **Voice Service**: Logs show successful startup ✅
- **Vosk Arabic Model**: Loaded from persistent volume ✅
- **XTTS Model**: Downloaded and initialized ✅
- **Maqsam Integration**: Handler initialized ✅
- **Health Checks**: Endpoints returning 404 ❌ - URL verification needed

**⚠️ Issue Found**: Health endpoints returning "Application not found" - need to verify correct Railway URL

---

## ✅ **Immediate Health Checks**

### 1. **Service Health Endpoints**
- [ ] Test health check: `GET https://hana-voice-service.up.railway.app/health`
- [ ] Verify it returns `200 OK` with voice service status
- [ ] Check model health: both `vosk_arabic` and `coqui_xtts` should be `true`
- [ ] Test root endpoint: `GET https://hana-voice-service.up.railway.app/`

### 2. **Model Availability**
- [ ] Confirm Vosk model loaded correctly (Arabic speech recognition)
- [ ] Confirm XTTS model loaded (Arabic text-to-speech)
- [ ] Check that models are cached and won't re-download on restarts

## 🔧 **Configuration Verification**

### 3. **Environment Variables** (Check in Railway Dashboard)
- [ ] `VOICE_SERVICE_SECRET` - Set to match Next.js app
- [ ] `LOG_LEVEL=INFO` - Appropriate for production
- [ ] `MAX_CONCURRENT_SESSIONS=10` - Prevents resource exhaustion
- [ ] `VOSK_MODEL_PATH=models/vosk-model-ar-0.22-linto-1.0`
- [ ] `TTS_MODEL_NAME=tts_models/multilingual/multi-dataset/xtts_v2`
- [ ] `SAMPLE_RATE=16000` - Required for Vosk

### 4. **Volume Mount Points**
- [ ] Verify persistent volume "voice-models" is mounted at `/data/models`
- [ ] Confirm Vosk model path exists: `/data/models/stt/vosk-model-ar-0.22-linto-1.0`
- [ ] Check volume has ~2-3GB free space for models

## 🌐 **Network & Integration Tests**

### 5. **Next.js App Communication**
- [ ] Test cross-service calls from Next.js to voice service
- [ ] Verify WebSocket connections work from frontend
- [ ] Check CORS configuration allows your domain
- [ ] Test voice service API calls from your app

### 6. **Maqsam Integration**
- [ ] Verify Maqsam status endpoint: `/maqsam/status`
- [ ] Check authentication credentials are configured
- [ ] Test call initiation flow (if testable in staging)
- [ ] Confirm WebSocket endpoints are responsive

### 7. **Supabase Integration** (if applicable)
- [ ] Test database connections from cloud environment
- [ ] Verify RLS policies work in production
- [ ] Check survey data storage and retrieval

## 🎯 **Voice Processing Tests**

### 8. **STT (Speech-to-Text) Testing**
- [ ] Send sample Arabic audio file for transcription
- [ ] Verify Arabic text recognition accuracy
- [ ] Test with different audio qualities/formats
- [ ] Check processing time (< 5 seconds for short clips)

### 9. **TTS (Text-to-Speech) Testing**
- [ ] Generate Arabic speech from sample text
- [ ] Verify natural Arabic pronunciation
- [ ] Check audio quality and format (16kHz WAV)
- [ ] Test Arabic survey questions generation

## 🛡️ **Security & Performance**

### 10. **Security Verification**
- [ ] Test secure endpoints require proper authentication
- [ ] Verify rate limiting works (60 requests/minute)
- [ ] Check session management limits (max 10 concurrent)
- [ ] Confirm no sensitive data logged

### 11. **Performance Monitoring**
- [ ] Monitor memory usage (should be < 3GB RAM)
- [ ] Check CPU utilization during voice processing
- [ ] Verify response times under load
- [ ] Monitor for memory leaks over time

## 📊 **Error Handling & Monitoring**

### 12. **Error Scenarios**
- [ ] Test invalid audio format handling
- [ ] Check Arabic text processing edge cases
- [ ] Verify graceful model failure handling
- [ ] Test network timeout scenarios

### 13. **Logging & Monitoring**
- [ ] Check Railway logs for any errors or warnings
- [ ] Verify structured logging is working
- [ ] Confirm health checks are running (every 30s-1min)
- [ ] Set up alerts for service failures

## 🎤 **End-to-End Healthcare Survey Tests**

### 14. **Survey Functionality**
- [ ] Test complete Arabic survey flow via WebSocket
- [ ] Verify question generation in Arabic
- [ ] Check response processing and storage
- [ ] Test survey completion and data integrity

### 15. **Telephony Integration Testing**
- [ ] Set up test phone number for Maqsam calls
- [ ] Test voice call initiation
- [ ] Verify Arabic speech recognition during calls
- [ ] Check call progress and hangup handling

## 🚀 **Production Readiness**

### 16. **Reliability Testing**
- [ ] Test service restart/recovery
- [ ] Verify model re-loading after container restart
- [ ] Check data persistence across deployments
- [ ] Confirm automatic failover (if applicable)

### 17. **Load Testing**
- [ ] Test multiple concurrent voice sessions (up to 10)
- [ ] Monitor resource usage under load
- [ ] Verify performance consistency
- [ ] Check Auto-scaling behavior

---

## 🚀 **Quick Verification Script**

Run this to quickly test your deployment:

```bash
# Test health endpoint
curl -s https://hana-voice-service.up.railway.app/health | jq .

# Test basic connectivity
curl -s https://hana-voice-service.up.railway.app/ | head -20

# Test Maqsam status
curl -s https://hana-voice-service.up.railway.app/maqsam/status | jq .
```

## 📝 **Quick Commands**

```bash
# Monitor logs in real-time
railway logs --follow

# Check service status
railway status

# Restart service
railway restart
```

## 🎯 **Priority Testing Order**

1. **Start here**: Health endpoints and basic connectivity
2. **Then**: Environment variables and volume mounting
3. **Next**: Voice models and processing
4. **Finally**: End-to-end healthcare survey flows

---

*Generated on: November 21, 2025*
*For Hana Voice SaaS Railway Deployment*
