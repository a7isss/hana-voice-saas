# Railway Deployment Fix Implementation

## Root Cause Analysis
The deployment fails because:
- Railway's Nixpacks auto-detects Python projects with pyproject.toml
- Nixpacks tries to use `uv sync` for dependency management
- The base Ubuntu image doesn't include `uv` by default
- Build fails with: `/bin/bash: line 1: uv: command not found`

## Solution Implementation

### ✅ Step 1: Create Nixpacks Configuration
Created `Python/voice_service/nixpacks.toml` to install `uv` during the Nixpacks setup phase.

**Configuration Details:**
- **Setup Phase**: Installs Python 3.12, pip, and curl
- **Install Phase**: Downloads and installs `uv` via official installer script
- **Build Phase**: Uses `uv sync --frozen --no-dev` for dependency installation  
- **Start Phase**: Runs the FastAPI application with uvicorn

### ✅ Step 2: Update Railway Configuration  
Updated `railway.toml` to remove explicit `buildCommand` and `startCommand` from voice service, allowing nixpacks to handle the build process using our custom configuration.

**Changes Made:**
- Removed `buildCommand = "pip install -r requirements.txt"` from voice service
- Removed `startCommand = "python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT"` from voice service
- Kept health checks and environment variables intact
- Maintained explicit build commands for the Next.js service

### ⏳ Step 3: Test Deployment
Deploy to Railway and verify that both services start correctly after the fix.

## Files Created/Modified
1. ✅ `Python/voice_service/nixpacks.toml` - Installs uv during build process
2. ✅ `railway.toml` - Removed conflicting build/start commands for voice service

## Technical Details

### Why This Solution Works
1. **Explicit UV Installation**: The nixpacks.toml forces Nixpacks to install `uv` in the setup phase
2. **Path Configuration**: Ensures `uv` is available in PATH for all subsequent phases
3. **Dependency Management**: Uses `uv sync` which is already configured in pyproject.toml
4. **Service Discovery**: Railway will automatically detect and use the nixpacks configuration
5. **No Command Conflicts**: By removing explicit build/start commands, nixpacks configuration takes precedence

### Expected Build Process
1. Nixpacks detects Python project with pyproject.toml in Python/voice_service/
2. Setup phase installs Python 3.12, pip, curl
3. Install phase downloads and installs `uv` via official script
4. Build phase runs `uv sync --frozen --no-dev` (as configured in nixpacks.toml)
5. Start phase launches application using `uv run uvicorn` (as configured in nixpacks.toml)

### Voice Service Environment Variables
The following environment variables are properly configured in railway.toml:
- `VOICE_SERVICE_SECRET` - Authentication secret
- `LOG_LEVEL` - Logging level
- `MAX_CONCURRENT_SESSIONS` - Session limits
- `RATE_LIMIT_PER_MINUTE` - Rate limiting
- `VOSK_MODEL_PATH` - STT model location
- `TTS_MODEL_NAME` - TTS model configuration
- `SAMPLE_RATE` - Audio sample rate (16000 Hz)
- `PROCESSING_TIMEOUT` - Processing timeout
- `SKIP_MODEL_LOADING` - Model loading control

This should resolve the "uv: command not found" error and allow successful deployment of both the Next.js frontend and Python voice service.
