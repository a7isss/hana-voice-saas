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

### **Before Starting - Check Environment**
```bash
# 1. Check Python version (must be 3.11+)
python --version
# Should show: Python 3.11.x, 3.12.x, or 3.13.x

# 2. Check disk space (need 5GB+ free)
# Windows: Check C:\ drive properties
# Linux/Mac: df -h

# 3. Check RAM (need 3GB+ available)
# Windows: Task Manager → Performance
# Linux: free -h | Mac: Activity Monitor

# 4. Check if ports 3000 and 8000 are free
netstat -an | find "3000"  # Windows
# lsof -i :3000  # Linux/Mac (if installed)
```

### **Step 1: Install Dependencies**
```bash
# Navigate to project root
cd "d:\0- Sites & services\2- voice robot"

# Install Next.js dependencies
npm install

# Navigate to voice service
cd Python/voice_service

# Install voice service dependencies (149 packages with models)
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

*******
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
Vosk Import: PASS
TTS Import: PASS
Vosk Model Loading: PASS
TTS Basic Test: PASS

Overall: 4/4 tests passed
SUCCESS: All basic model tests PASSED! Ready for integration.
```

### **TTS Model Testing & Caching Issue**

**❗ COMMON ISSUE: TTS Downloads Every Time**

> **Expected:** TTS models should download once and reuse cached versions
> **Reality:** You may see models downloading repeatedly between runs
>
> **Causes:**
> - Temporary cache files being cleaned up
> - Different working directories between runs
> - TTS model cache location conflicts

**🔧 Workaround: Manual TTS Cache Setup**
```bash
cd Python/voice_service

# 1. Pre-download and cache the TTS model once
python -c "
import os
from TTS.api import TTS

print('📥 Downloading TTS model (one-time setup ~1GB)...')
tts = TTS('tts_models/multilingual/multi-dataset/xtts_v2')
print('✅ TTS model downloaded and cached')

# Verify cache location
import torch
cache_dir = torch.hub.get_dir()
print(f'Cache directory: {cache_dir}')
"

# 2. Test TTS generation (should be instant after caching)
python -c "
from TTS.api import TTS
print('🎵 Testing Arabic TTS (should be fast now)...')
tts = TTS('tts_models/multilingual/multi-dataset/xtts_v2')
tts.tts_to_file(text='مرحباً، شكراً لك', file_path='test_cached.wav')
print('✅ TTS cached and working - test_cached.wav created')
"

# 3. Prevent cache cleanup (optional)
# Add to your system's temp file exclusions or backup TTS cache
```

**💡 Expected TTS Behavior After Setup:**
- **First run:** Downloads ~1GB model files (takes 2-5 minutes)
- **Subsequent runs:** Uses cached model (loads in <30 seconds)
- **Service restart:** Should reuse cached model

**🚨 If TTS Still Downloads Every Time:**
```bash
# Check cache directory
python -c "import torch; print('Cache dir:', torch.hub.get_dir())"

# List cached models
ls -la /path/to/cache/dir/  # Check actual path from above

# Manual cache preservation
# Windows: Exclude TTS cache dir from temp file cleanup
# Linux/Mac: Backup TTS cache dir between tests
```

### **TTS Model Optimization**
```bash
# Use pre-cached model approach (recommended)
from TTS.api import TTS

class CachedTTS:
    _instance = None

    @classmethod
    def get_tts(cls):
        if cls._instance is None:
            print('Initializing TTS model (first time only)...')
            cls._instance = TTS('tts_models/multilingual/multi-dataset/xtts_v2')
        return cls._instance

# Usage in your code:
tts = CachedTTS.get_tts()  # Fast after first call
tts.tts_to_file(text='your text', file_path='output.wav')
```
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

## 🚀 **Complete Local Development Setup**

### **Quick Start Commands (Copy-Paste Ready)**

#### **One-Time Setup (First Time Only)**
```bash
# 1. Navigate to project root
cd "d:\0- Sites & services\2- voice robot"

# 2. Install all dependencies
npm install
cd Python/voice_service
uv sync

# 3. Set up environment files
echo "ADMIN_USERNAME=hana_admin_demo" >> ../.env.local
echo "ADMIN_PASSWORD=DemoPass123!" >> ../.env.local
echo "JWT_SECRET_KEY=yourdemo-jwt-secret-key-change-in-production-abcdefgh123456789" >> ../.env.local

echo "VOSK_MODEL_PATH=models/vosk-model-ar-0.22-linto-1.1.0" >> .env
echo "TELEPHONY_TOKEN=test-token" >> .env

# 4. Verify models exist
cd Python/voice_service
ls -la models/
# Should show: am/ conf/ graph/ ivector/ rescore/

# 5. Run model verification
python tests/test_models_simple.py
```

#### **Starting Services (Every Development Session)**

**Terminal 1: Voice Service (Python)**
```bash
# From project root
cd "d:\0- Sites & services\2- voice robot\Python\voice_service"

# Start voice service on port 8000
uv run python -m app.main

# Or with uvicorn reload (for development)
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Expected output:
# 🚀 Starting Arabic Healthcare Voice Service...
# INFO:     Uvicorn running on http://0.0.0.0:8000
# ✅ Voice service ready!
```

**Terminal 2: Next.js App**
```bash
# From project root (separate terminal)
cd "d:\0- Sites & services\2- voice robot"

# Start Next.js development server
npm run dev

# Expected output:
# Ready - started server on 0.0.0.0:3001 (uses 3001 if 3000 busy)
# ✓ Compiled successfully
```

#### **Testing the Complete Setup**

**Terminal 3: Verification Tests**
```bash
# Test voice service health
curl http://localhost:8000/health

# Test Next.js health
curl http://localhost:3001/api/health

# Test authentication API
curl -X POST http://localhost:3001/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"validate"}'
```

### **Access Your Application**

1. **Admin Dashboard:** http://localhost:3001
   - Login with: `hana_admin_demo` / `DemoPass123!`
   - Should redirect to full dashboard with sidebar

2. **Voice Tester:** http://localhost:3001/admin/voice-tester
   - Test WebSocket connection to voice service
   - Arabic voice chat functionality

3. **Voice Service API:** http://localhost:8000/docs
   - Interactive API documentation
   - WebSocket endpoint testing

### **Common Startup Issues & Solutions**

#### **Port Conflicts**
```bash
# Check what's using ports
netstat -an | find "3000"
netstat -an | find "8000"

# Kill conflicting processes if needed
# Windows: Use Task Manager or taskkill /PID <pid>
```

#### **Model Loading Errors**
```bash
# Check model directory
cd Python/voice_service
ls -la models/

# Verify correct model path in .env
cat .env | grep VOSK_MODEL_PATH

# Expected: VOSK_MODEL_PATH=models/vosk-model-ar-0.22-linto-1.1.0
```

#### **Python Environment Issues**
```bash
# Activate uv environment (if using virtual env)
cd Python/voice_service
uv sync

# Check Python version
python --version

# Verify imports work
python -c "from vosk import Model; from TTS.api import TTS; print('OK')"
```

#### **Development Server Won't Start**
```bash
# Clear Next.js cache
rm -rf .next/
npm run build
npm run dev

# Or try npm cache clear
npm cache clean --force
npm install
npm run dev
```

### **🎯 Development Workflow**

1. **Start Services:** Voice service first (takes longer), then Next.js
2. **Login:** Use demo credentials to access admin dashboard
3. **Test Voice:** Use voice-tester page for WebSocket testing
4. **Debug:** Check browser DevTools for WebSocket connections
5. **Iterate:** Changes to voice service auto-reload, Next.js hot reloads

**Memory Usage Warning:**
- Voice service loads ~2GB models in RAM
- Next.js dev server uses ~300MB
- **Total:** ~2.3GB RAM recommended

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
