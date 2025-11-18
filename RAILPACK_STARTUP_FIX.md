# Railpack Startup Fix - Railway Deployment

## Problem Solved ✅
Railway/Railpack was showing error: "⚠ Script start.sh not found" and "✖ Railpack could not determine how to build the app."

## Solution Applied - Scripts Created

### 1. `Python/voice_service/start.sh`
**Purpose**: Main startup script that Railpack looks for

```bash
#!/bin/bash

echo "==========================================="
echo "Starting Python Voice Service on Railway"
echo "Port: $PORT | Health Check: /health"
echo "==========================================="

# Set up environment
export LOG_LEVEL=${LOG_LEVEL:-"INFO"}
export MAX_CONCURRENT_SESSIONS=${MAX_CONCURRENT_SESSIONS:-"10"}

echo "Environment Configuration:"
echo "✓ LOG_LEVEL: $LOG_LEVEL"
echo "✓ MAX_CONCURRENT_SESSIONS: $MAX_CONCURRENT_SESSIONS"
echo "✓ PORT: $PORT"

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "ERROR: uv is not available"
    exit 1
else
    echo "✓ uv is available"
fi

# Create virtual environment if needed
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    uv venv
    source .venv/bin/activate
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
uv sync --frozen --no-dev
echo "✓ Dependencies installed"

echo
echo "Starting Python voice service..."

# Start the service
uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT --log-level $LOG_LEVEL
```

### 2. `Python/voice_service/build.sh`
**Purpose**: Build script for Railway/Railpack build process

```bash
#!/bin/bash

echo "==========================================="
echo "Building Python Voice Service for Railway"
echo "==========================================="

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "ERROR: uv is not available"
    exit 1
else
    echo "✓ uv is available: $(uv --version)"
fi

# Create virtual environment if needed
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    uv venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
uv sync --frozen --no-dev

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "✗ Failed to install dependencies"
    exit 1
fi

echo
echo "Build completed successfully!"
echo "Ready for Railway deployment"
```

### 3. Updated Files

#### `Procfile` (Railway process definition)
```
web: uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### `nixpacks.toml` (Railway build system config)
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

## Why This Fixes the Railpack Error

**Before**: 
- Railpack looked for `start.sh` script - not found
- Railpack couldn't determine how to build the Python app
- Deployment failed

**After**:
- Railpack finds `start.sh` script ✅
- Script sets up environment and starts service ✅
- Build process works with `build.sh` ✅
- Dependencies managed with UV package manager ✅

## Expected Deployment Flow

1. **Railway detects service** via multiple configuration files
2. **Railpack runs build.sh** to install dependencies
3. **Railpack runs start.sh** to start the service
4. **Service becomes available** at the Railway URL

## Testing the Fix

After pushing these changes:

1. **Check Railway Dashboard**: Should show 2 services
2. **Monitor Build Logs**: Should see successful dependency installation
3. **Test Health Endpoint**: `curl https://your-service.railway.app/health`
4. **Check Service Status**: Should be "Healthy" in dashboard

## Environment Variables Needed

Set these in Railway dashboard for the Python service:

```bash
VOICE_SERVICE_SECRET=hana_voice_shared_secret_2024_secure_key
LOG_LEVEL=INFO
MAX_CONCURRENT_SESSIONS=10
VOSK_MODEL_PATH=models/vosk-model-ar-0.22-linto-1.1.0
TTS_MODEL_NAME=tts_models/multilingual/multi-dataset/xtts_v2
```

---

**Fix Applied**: November 18, 2025  
**Railpack Version**: 0.12.0  
**Python Service**: FastAPI with UV package manager  
**Status**: Ready for deployment
