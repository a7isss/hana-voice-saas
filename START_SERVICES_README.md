# Voice Robot SaaS - Service Startup Guide

This document contains the exact steps to start all services for the Voice Robot SaaS project.

## Services Overview

1. **Python Voice Service** (port 8000) - Arabic STT/TTS backend
2. **Next.js UI** (port 3002) - Voice tester and admin interfaces

## Python Voice Service Startup

### Prerequisites
- Python 3.11 or higher
- uv package manager
- FFmpeg installed (for WebM audio conversion)
- Vosk model files
- CoquiTTS models (downloaded on first use)

### Starting Python Service

```bash
# Navigate to Python service directory
cd "D:\0- Sites & services\2- voice robot\Python\voice_service"

# Start with uv (recommended)
uv run -- from app.main import app; import uvicorn; uvicorn.run(app, host="0.0.0.0", port=8000, reload=True, log_level="info")
```

### Alternative: Start with uvicorn directly

```bash
# From the Python/voice_service directory
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level info
```

### Health Check

After starting, verify the service is working:
- GET http://localhost:8000/health
- Should return JSON with vosk_arabic: true

## Next.js UI Startup

### Prerequisites
- Node.js 18 or higher
- pnpm or npm

### Starting Next.js Service

```bash
# Navigate to project root
cd "D:\0- Sites & services\2- voice robot"

# Install dependencies (first time only)
npm install

# Start development server on port 3002
npm run dev -- -p 3002
# or
./node_modules/.bin/next dev --port 3002
```

### Alternative Commands

```bash
# With pnpm
pnpm install
pnpm dev --port 3002

# With npm
npm install
npm run dev -- -p 3002
```

## Batch Files

### Python Voice Service Batch (start_python.bat)

```batch
@echo off
echo Starting Python Voice Service...
cd "D:\0- Sites & services\2- voice robot\Python\voice_service"
uv run -- from app.main import app; import uvicorn; uvicorn.run(app, host="0.0.0.0", port=8000, reload=True, log_level="info")
pause
```

### Next.js UI Batch (start_nextjs.bat)

```batch
@echo off
echo Starting Next.js Voice Tester UI...
cd "D:\0- Sites & services\2- voice robot"
npm run dev -- -p 3002
pause
```

## Verification Steps

### Check Services are Running

1. **Port Check (PowerShell)**:
```powershell
Get-NetTCPConnection | Where-Object { $_.LocalPort -eq 8000 -or $_.LocalPort -eq 3002 } | Select-Object LocalPort, State
```

Expected output:
```
LocalPort  State
---------  -----
     3002 Listen
     8000 Listen
```

2. **Health Check**:
- Visit: http://localhost:3002/voice-tester
- Python health: curl http://localhost:8000/health

### Test Voice Functionality

1. Open http://localhost:3002/voice-tester
2. Click "بدء التسجيل" (Start Recording)
3. Allow microphone access
4. Speak Arabic (example: "مرحباً، كيف حالك؟")
5. Click "إيقاف التسجيل" (Stop Recording)
6. You should see:
   - Your transcribed text
   - Hana echoing back what you said

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Install: `winget install Gyan.FFmpeg`
   - Check path: ffmpeg installation location

2. **Python model not loading**
   - Check: models/vosk-model-ar-0.22-linto-1.1.0 exists
   - STT model: size ~200MB

3. **TTS model loading**
   - Downloads on first use (~500MB XTTS model)
   - May take 1-2 minutes on first run

4. **Port already in use**
   - Kill processes: `taskkill /f /im python.exe`
   - Or change ports: edit --port parameter

5. **Voice tester not connecting**
   - Check Python service logs for WebSocket errors
   - Verify WebSocket URL: ws://localhost:8000/ws/echo

### Log Locations

- **Python service logs**: Terminal output from uvicorn
- **Next.js logs**: Terminal output from next dev
- **Browser console**: F12 → Console for WebSocket errors

## Production Notes

For production deployment:
- Use stable ports (8000, 3000)
- Disable reload=True
- Set production environment variables
- Use reverse proxy (nginx)
- Enable SSL/TLS
- Configure CORS properly

## Quick Start Commands

### Start All Services (separate terminals)

**Terminal 1 - Python:**
```batch
cd "D:\0- Sites & services\2- voice robot\Python\voice_service"
uv run -- from app.main import app; import uvicorn; uvicorn.run(app, host="0.0.0.0", port=8000, reload=True, log_level="info")
```

**Terminal 2 - Next.js:**
```batch
cd "D:\0- Sites & services\2- voice robot"
./node_modules/.bin/next dev --port 3002
```

### Test Immediately

```bash
# Open browser to test
start http://localhost:3002/voice-tester
```

## Service URLs

- **Voice Tester**: http://localhost:3002/voice-tester
- **Python API Health**: http://localhost:8000/health
- **Admin Panel**: http://localhost:3002/admin

---
