# 🔊 Local Testing Guide - Hana Voice SaaS

**Comprehensive guide for testing the Arabic voice service integration locally**

## 📋 **Table of Contents**
- [Pre-Flight Checklist](#pre-flight-checklist)
- [Environment Setup](#environment-setup)
- [Model Verification (STT & TTS)](#model-verification-stt--tts)
- [Service Testing](#service-testing)
- [WebSocket Testing](#websocket-testing)
- [UI Integration Testing](#ui-integration-testing)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

---

## ✅ **Pre-Flight Checklist**

Before starting any testing, verify these requirements:

### **Python Environment**
- [ ] Python 3.11+ installed: `python --version`
- [ ] UV package manager installed: `uv --version`
- [ ] 3GB+ available RAM for voice models
- [ ] 5GB+ available disk space for models

### **Project Files**
- [ ] Repository cloned: `git clone [your-repo]`
- [ ] Dependencies installed: `uv sync` (from voice_service directory)
- [ ] Arabic voice models ready (**IMPORTANT**):

```
📁 Python/voice_service/models/
├── am/          ✅ Acoustic model (~500MB)
├── conf/        ✅ Configuration files
├── graph/       ✅ Language model graph (~2GB)
├── ivector/     ✅ Speaker identification
└── rescore/     ✅ Grammar rescoring

Status: Models were downloaded but are NOT in git (correct behavior)
```

### **Voice Models Status**
- [ ] **Arabic STT (Vosk)**: Model files present in `models/` directory
- [ ] **Arabic TTS (Coqui XTTS)**: Auto-downloads on first use (5 Arabic models available)

### **Testing Prerequisites**
- [ ] http://localhost:3000 (Next.js app) accessible
- [ ] WebSocket support in browser (Chrome/Firefox recommended)
- [ ] Microphone access working
- [ ] HTTPS support (for microphone if using localhost:3000)
- [ ] No firewall blocking WebSocket ports (8000, 3000)

---

## 🏗️ **Environment Setup**

### **Step 1: Install Dependencies**
```bash
# Navigate to voice service
cd Python/voice_service

# Install all dependencies (149 packages)
uv sync

# Verify environment
python -c "import sys; print(f'Python: {sys.version_info}')"

# Check voice libraries
python -c "from vosk import Model; from TTS.api import TTS; print('✅ Voice libraries loaded')"
```

### **Step 2: Verify STT Models**
```bash
cd Python/voice_service

# Check Vosk model structure
ls -la models/
# Should show: am/ conf/ graph/ ivector/ rescore/

# Quick model validation
python -c "
from vosk import Model, KaldiRecognizer
model = Model('models')
rec = KaldiRecognizer(model, 16000)
print('✅ STT model loaded and ready')
"
```

### **Step 3: Verify TTS Models**
```bash
cd Python/voice_service

# Check available Arabic models (no manual download needed)
python -c "
from TTS.api import TTS
models = TTS.list_models()
arabic_models = [m for m in models if 'ar' in m.lower() or 'arabic' in m.lower()]
print(f'✅ {len(models)} total models, {len(arabic_models)} Arabic models available')
print('Sample Arabic models:')
for model in arabic_models[:3]:
    print(f'  - {model}')
"
```

### **Step 4: Environment Variables**
Create `.env` file in voice service directory:
```bash
# Voice Service Configuration
TELEPHONY_TOKEN=your-test-telephony-token-here
VOICE_SERVICE_SECRET=admin-test-secret
VOICE_SERVICE_TOKEN=jwt-test-secret
MAX_CONCURRENT_SESSIONS=10
RATE_LIMIT_PER_MINUTE=60
LOG_LEVEL=INFO
VOICE_SERVICE_ENV=development
```

---

## 🧪 **Model Verification (STT & TTS)**

### **STT Model Testing (Manual Files Required)**
```bash
cd Python/voice_service

# Run comprehensive model tests
python tests/test_models_simple.py
```

**Expected Output:**
```
Hana Voice Service - Phase 1 Model Verification
Python version: 3.13.5 (main, Jun 12 2025, 16:37:03) [MSC v.1929 64 bit (AMD64)]
Working directory: F:\0- Future\0- LATEST VERSION AI AGENT\Python\voice_service

Testing Vosk import...
PASS: Vosk imported successfully!

Testing Coqui TTS import...
PASS: Coqui TTS imported successfully!

Testing Arabic Vosk model loading...
PASS: Arabic Vosk model loaded successfully!
   Model path: models
   Recognizer created: SUCCESS

Testing Coqui TTS basic functionality...
PASS: Found 94 total models
   Arabic models: 5
   Sample Arabic models:
      - tts_models/multilingual/multi-dataset/bark
      - tts_models/en/blizzard2013/capacitron-t2-c50
      - tts_models/en/blizzard2013/capacitron-t2-c150_v2

Test Results Summary:
========================================
Vosk Import: PASS
TTS Import: PASS
Vosk Model Loading: PASS
TTS Basic Test: PASS

Overall: 4/4 tests passed
SUCCESS: All basic model tests PASSED! Ready for integration.
```

### **TTS Model Testing (Auto-Downloaded)**
```bash
cd Python/voice_service

# Test Arabic text-to-speech (first run will download models ~500MB each)
python -c "
from TTS.api import TTS

# Use first Arabic model
tts = TTS('tts_models/multilingual/multi-dataset/bark')
tts.tts_to_file(text='أهلاً وسهلاً، كيف يمكنني مساعدتك؟', file_path='test_arabic.wav')

print('✅ Arabic TTS successful - test_arabic.wav created')
"
```

---

## 🚀 **Service Testing**

### **Start Voice Service**
```bash
cd Python/voice_service

# Method 1: Using UV (recommended)
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Method 2: Direct Python
python -m app.main

# Method 3: With environment file
TELEPHONY_TOKEN=test-token python -m app.main
```

**Expected Startup Logs:**
```
🚀 Starting Arabic Healthcare Voice Service...
✅ Voice service ready!

INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### **Health Check Verification**
```bash
# Open in browser or curl
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "voice_service": "loaded",
  "models": {
    "stt": "Vosk Arabic v0.22",
    "tts": "Coqui XTTS v2"
  },
  "models_loaded": true
}
```

### **API Documentation**
- **OpenAPI Docs:** http://localhost:8000/docs (interactive API testing)
- **Alternative Docs:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

---

## 🔌 **WebSocket Testing**

### **Available Endpoints**
- `ws://localhost:8000/ws` - General voice processing
- `ws://localhost:8000/ws/healthcare-questionnaire` - Healthcare surveys
- `ws://localhost:8000/ws/telephony?token=YOUR_TOKEN` - Telephony auth
- `ws://localhost:8000/ws/telephony/healthcare?token=YOUR_TOKEN` - Telephony healthcare

### **Test with Node.js (Simplest)**
```bash
# Run WebSocket test client
node run_model_test.py  # This actually runs a WS test
```

### **Test with Browser Console**
```javascript
// Open browser console, paste this:

// Test healthcare endpoint (no auth)
const ws1 = new WebSocket('ws://localhost:8000/ws/healthcare-questionnaire');
ws1.onopen = () => console.log('✅ Connected to healthcare endpoint');
ws1.onmessage = (e) => console.log('📨 Received:', e.data);
ws1.onerror = (e) => console.error('❌ Error:', e);

// Test telephony endpoint (with token)
const ws2 = new WebSocket('ws://localhost:8000/ws/telephony/healthcare?token=test-telephony-token');
ws2.onopen = () => console.log('✅ Connected to telephony healthcare endpoint');
ws2.onerror = (e) => console.error('❌ Telephony error:', e);
```

---

## 🎛️ **UI Integration Testing**

### **Voice Service Tester Page**
1. **Navigate:** `/admin/voice-tester` in your Next.js app
2. **Connection:** Should automatically connect to `ws://localhost:8000/ws/healthcare-questionnaire`
3. **Test Flow:**
   - Click "Start Voice Chat" → Should see "مرحبا , انا هناء" greeting (text + voice)
   - Click record button → Speak in Arabic ("أشعر بصداع")
   - Should receive Arabic response both text and audio
   - Conversation continues until you stop

### **Start Next.js Development Server**
```bash
# From project root
npm run dev

# Should show:
# Ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### **Cross-Service Testing**
```bash
# Terminal 1: Start Voice Service
cd Python/voice_service && python -m app.main

# Terminal 2: Start Next.js
npm run dev

# Terminal 3: Test with curl
curl http://localhost:3000/api/health  # Next.js API health
curl http://localhost:8000/health      # Voice service health
```

---

## 🔧 **Troubleshooting**

### **"Failed to import vosk"**
```bash
# Check package installation
cd Python/voice_service
python -c "import vosk; print('Vosk ok')"

# Reinstall if needed
uv sync --reinstall
```

### **"Models not found"**
```bash
# Check if models exist
ls -la Python/voice_service/models/

# Should show:
# am/  conf/  graph/  ivector/  rescore/

# If missing, models were not downloaded
# Follow model download instructions in README
```

### **"WebSocket connection failed"**
- **Check:** Voice service running on port 8000
- **Check:** Firewall not blocking port 8000
- **Use:** `netstat -an | grep 8000` to verify listening

### **"TTS models not downloading"**
```bash
# First TTS call will download ~500MB
python -c "
from TTS.api import TTS
tts = TTS('tts_models/multilingual/multi-dataset/bark')
print('Model downloaded successfully')
"
```

### **Microphone Access Issues**
- **HTTPS Required:** Use `https://localhost:3000` for microphone
- **Browser Permissions:** Allow microphone access when prompted
- **Browser Selection:** Chrome or Firefox preferred

### **Environment Variable Issues**
```bash
# Create .env file in voice_service directory
echo "TELEPHONY_TOKEN=test-telephony-token" > Python/voice_service/.env
```

### **Common Error Messages**

| Error | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'vosk'` | Run `uv sync` in voice_service directory |
| `Model not found in /path/models` | Verify models directory exists and has STT files |
| `WebSocket connection failed` | Check voice service is running on port 8000 |
| `TTS models not available` | First TTS call will auto-download models |

### **Logs and Debugging**
```bash
# Voice service logs
cd Python/voice_service
python -m app.main  # Shows detailed startup logs

# Test with verbose output
python tests/test_models_simple.py  # Shows model loading details

# Check Next.js logs
npm run dev  # Shows connection attempts and errors
```

---

## 🚀 **Production Deployment**

### **Render Deployment Checklist**
- [ ] Voice service deploys to Render
- [ ] Models download automatically (~2GB on first deploy)
- [ ] Environment variables set in Render dashboard:
  ```
  TELEPHONY_TOKEN=telephony-provided-token
  VOICE_SERVICE_SECRET=your-admin-secret
  VOICE_SERVICE_TOKEN=jwt-secret
  ```
- [ ] Health check: `https://your-service.onrender.com/health`
- [ ] WebSocket URLs ready for telephony company

### **Telephony Integration**
```javascript
// What you provide to telephony company:
const WEBSOCKET_URL = 'wss://your-service.onrender.com/ws/telephony/healthcare';
const AUTH_TOKEN = 'telephony-provided-token';

// Example connection:
const ws = new WebSocket(`${WEBSOCKET_URL}?token=${AUTH_TOKEN}`);
```

### **Performance Expectations**
- **Startup Time:** 2-3 minutes (model loading on first run)
- **Memory Usage:** 1-2GB steady state with models loaded
- **Response Time:** Arabic voice responses in 2-5 seconds
- **Concurrent Calls:** 10+ simultaneous voice conversations

### **Monitoring & Maintenance**
- **Health Checks:** Endpoint at `/health` for monitoring
- **Logs:** Available in Render dashboard
- **Updates:** Git commits automatically deploy
- **Scaling:** Render automatically scales as needed

---

## 📞 **Support & Resources**

### **Documentation**
- `PROJECT_DOCUMENTATION.md` - Detailed technical specs
- `README.md` - Quick start guide
- `Python/voice_service/README.md` - Voice service specific docs
- `memory-bank/` - Development context and decisions

### **Quick Command Reference**
```bash
# Test environment
cd Python/voice_service && python tests/test_models_simple.py

# Start services
npm run dev          # Next.js on :3000
cd Python/voice_service && python -m app.main  # Voice service on :8000

# Verify connections
curl http://localhost:3000/api/health    # Next.js
curl http://localhost:8000/health        # Voice service
```

---

## ✅ **Final Checklist Before Production**

### **Voice Service Ready**
- [ ] All 4 model tests pass (STT import, TTS import, STT model load, TTS model list)
- [ ] Voice service starts without errors (models load in memory)
- [ ] WebSocket endpoints respond to connections
- [ ] Arabic voice processing works end-to-end

### **Next.js Integration Ready**
- [ ] Voice service tester page accessible at `/admin/voice-tester`
- [ ] Arabic text display working (RTL support)
- [ ] Audio playback working in browser
- [ ] Cross-origin WebSocket connection successful

### **Telephony Integration Ready**
- [ ] Token authentication implemented and tested
- [ ] Healthcare WebSocket endpoint ready
- [ ] Production Render deployment functional
- [ ] Telephony company has WebSocket URL and token

### **Documentation Ready**
- [ ] This testing guide reviewed and followed
- [ ] Environment variables documented
- [ ] Production deployment steps clear
- [ ] Troubleshooting steps documented

---

**🎉 Your Arabic voice service system is ready for healthcare automation!**

**Next Steps:**
1. **Follow this guide for local testing**
2. **Verify all checklist items**
3. **Connect with telephony company**
4. **Launch Arabic voice healthcare surveys**

**Remember:** STT models are downloaded manually, TTS models download automatically! 🌟
