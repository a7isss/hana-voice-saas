# Railway Detection Fix - Python Voice Service

## Problem Solved ✅
Railway was not properly detecting the Python voice service due to the nested folder structure (`Python/voice_service/`). Multiple configuration files have been added to ensure proper detection.

## Configuration Files Added

### 1. `/Python/voice_service/Procfile`
```bash
web: uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
**Purpose**: Standard Heroku/Railway process file for web service detection

### 2. `/Python/voice_service/railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "uv sync --frozen --no-dev"
  },
  "deploy": {
    "startCommand": "uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```
**Purpose**: Explicit Railway service configuration

### 3. `/Python/voice_service/nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ['python311', 'python311Packages.uv']

[phases.install]
cmds = [
  'uv venv',
  'source .venv/bin/activate',
  'uv sync --frozen --no-dev'
]

[phases.build]
cmds = [
  'source .venv/bin/activate',
  'echo "Python service ready for deployment"'
]

[phases.start]
cmd = 'source .venv/bin/activate && uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT'
```
**Purpose**: Explicit Nixpacks build configuration for UV package manager

### 4. Updated `/railway.toml`
```toml
[[services]]
name = "hana-voice-service"
sourcePath = "Python/voice_service"
buildCommand = "uv sync --frozen --no-dev"
startCommand = "uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
```
**Purpose**: Multi-service configuration with explicit Python service mapping

## Why This Fixes Railway Detection

### Before (Failed Detection)
- Railway scanned root directory
- Found `package.json` (Node.js)
- Ignored `Python/` subdirectory
- Only deployed frontend service

### After (Successful Detection)
- Railway finds multiple Python detection signals:
  1. `Procfile` (standard web service indicator)
  2. `pyproject.toml` (Python project file)
  3. `railway.json` (explicit configuration)
  4. `nixpacks.toml` (build configuration)
  5. `railway.toml` mapping (explicit service definition)

## Railway Service Structure

After deployment, you should see:

```
Railway Project Dashboard
├── hana-voice-saas (Frontend)
│   ├── URL: https://hana-voice-saas-production.railway.app
│   └── Port: Automatically assigned
└── hana-voice-service (Backend)
    ├── URL: https://hana-voice-service-production.railway.app
    ├── Port: Automatically assigned
    └── Health Check: /health
```

## Deployment Steps

### 1. Push Changes
```bash
git add .
git commit -m "Fix Railway detection for Python voice service

- Add Procfile for service detection
- Add railway.json for explicit configuration
- Add nixpacks.toml for UV build process
- Update railway.toml with proper service mapping"
git push origin master
```

### 2. Railway Dashboard Verification
1. Go to your Railway project
2. You should now see **2 services**:
   - `hana-voice-saas` (Node.js/Next.js)
   - `hana-voice-service` (Python/FastAPI)
3. If you only see 1 service, the detection is still failing

### 3. Environment Variables
Set these in the `hana-voice-service` environment:

```bash
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

### 4. Voice Models Setup
1. Create Railway Volume in dashboard
2. Mount to `/data` directory
3. Upload voice models to volume

## Testing the Fix

### 1. Check Railway Dashboard
- Should show 2 services after deployment
- Both should have green "Healthy" status

### 2. Test Health Endpoints
```bash
# Frontend
curl https://hana-voice-saas-production.railway.app/api/health

# Backend
curl https://hana-voice-service-production.railway.app/health
```

### 3. Test WebSocket Connection
Use the verification script:
```bash
python Python/voice_service/deploy_verification.py https://hana-voice-service-production.railway.app
```

## Troubleshooting

### If Railway Still Shows Only 1 Service

1. **Check Railway Logs**:
   - Go to service logs in Railway dashboard
   - Look for build errors or detection warnings

2. **Manual Service Creation**:
   - In Railway dashboard, click "New Service"
   - Select "Deploy from GitHub repo"
   - Choose the same repository
   - Set root directory to `Python/voice_service`

3. **Verify Files**:
   - Ensure all 4 detection files are in `Python/voice_service/`
   - Check that `pyproject.toml` exists and is valid

### If Build Fails

1. **Check Build Logs**:
   - Look for UV installation errors
   - Verify Python 3.11+ is available

2. **Environment Issues**:
   - Ensure `uv` is available in Nixpacks
   - Check that virtual environment creation succeeds

### If Service Won't Start

1. **Port Configuration**:
   - Ensure `$PORT` environment variable is used
   - Check that FastAPI binds to `0.0.0.0`

2. **Health Check**:
   - Verify `/health` endpoint returns 200
   - Check that voice models are accessible

## Success Indicators

✅ **Railway Dashboard Shows 2 Services**
✅ **Both services have green health status**
✅ **Health endpoints return 200**
✅ **WebSocket connections establish**
✅ **Voice processing works end-to-end**

---

**Last Updated**: November 18, 2025  
**Fix Version**: 2.0  
**Railway Detection**: Multi-file approach for guaranteed detection
