# Railway CLI Model Upload Guide

## Overview
Guide for manually uploading voice model files to Railway volumes using Railway CLI on Windows, as an alternative to the automatic deployment process.

## Installation

### Install Railway CLI on Windows
```powershell
# Use winget (recommended for Windows)
winget install railwayapp.cli

# Or install via npm
npm install -g @railway/cli

# Verify installation
railway --version
```

## Authentication & Setup

### Login to Railway
```powershell
railway login
# Follow the browser prompt to authenticate
```

### Link to Your Project
```powershell
# Link to your specific railway project (if not already linked)
railway link
# Select your hana-voice-saas project from the list
```

## Model Upload Commands

### Upload Vosk STT Model
```powershell
# Upload the Arabic STT model to Railway volume
railway volumes upload /data/models/stt/vosk-model-ar-0.22-linto-1.1.0 Python/voice_service/models/stt/vosk-model-ar-0.22-linto-1.1.0
```

### Upload TTS Model (if available locally)
```powershell
# Upload Coqui XTTS model if you have it downloaded locally
railway volumes upload /data/models/tts/tts_models--multilingual--multi-dataset--xtts_v2 Python/voice_service/models/tts/tts_models--multilingual--multi-dataset--xtts_v2
```

## Verification Commands

### Check Volume Contents
```powershell
# List all volumes
railway volumes list

# SSH into your service to verify files exist
railway shell
ls -la /data/models/
ls -la /data/models/stt/vosk-model-ar-0.22-linto-1.1.0/
ls -la /data/models/tts/tts_models--multilingual--multi-dataset--xtts_v2/
```

### Check Service Health
After uploading models, verify the service can find them:
```powershell
# Check health endpoint
curl https://your-service-domain.railway.app/health
# Should show: {"models": {"vosk_arabic": true, "coqui_xtts": true}}
```

## Alternative: Automatic Deployment

For most cases, **use the automatic system** instead of manual uploads:

### Automatic Process Flow
1. **Local Development**: Models stay in `Python/voice_service/models/`
2. **Git Push**: Triggers Railway deployment
3. **Build Process**: `setup_voice_models.py` runs automatically
4. **Auto Copy**: Local Vosk STT model copies to `/data/models/stt/`
5. **Auto Download**: Coqui XTTS model downloads automatically
6. **Service Ready**: Models available at runtime

### Trigger Automatic Upload
```bash
# Just push your changes - the system handles the rest
git add .
git commit -m "Fix Docker build for Railway deployment"
git push origin main
```

## Current Project Status

### Available Locally
- ✅ **Vosk Arabic STT**: `Python/voice_service/models/stt/vosk-model-ar-0.22-linto-1.1.0/` (~500MB)
- ❓ **Coqui XTTS TTS**: May not be downloaded locally yet

### Railway Volume Structure
```
📁 /data/models/
├── 📁 stt/
│   └── 📁 vosk-model-ar-0.22-linto-1.1.0/  ← Will be uploaded automatically
│       ├── 📁 am/
│       ├── 📁 conf/
│       ├── 📁 graph/
│       ├── 📁 ivector/
│       └── 📁 rescore/
└── 📁 tts/
    └── 📁 tts_models--multilingual--multi-dataset--xtts_v2/  ← Downloads automatically
```

## Troubleshooting

### Common Issues

#### Volume Upload Fails
```powershell
# Make sure you're in the right directory
cd f:\0- Future\0- LATEST VERSION AI AGENT

# Check if project is linked
railway link

# Try uploading with verbose output
railway volumes upload /data/models/stt/vosk-model-ar-0.22-linto-1.1.0 Python/voice_service/models/stt/vosk-model-ar-0.22-linto-1.1.0 --verbose
```

#### Models Not Found After Upload
```powershell
# Check if files actually uploaded
railway shell
find /data/models -name "*.bin" -o -name "*.pth" -o -name "*.json" | head -10

# Verify service configuration
railway logs
# Look for lines mentioning "models" or "vosk" or "tts"
```

#### Permission Issues
```powershell
# Make sure you have write access to the railway project
railway whoami

# Check your role on the project in Railway dashboard
# Should be "Member" or "Admin" to upload to volumes
```

### Getting Volume Information
```powershell
# Get detailed volume info
railway volumes create --help

# List all volumes with details
railway volumes list --json | jq .

# Check volume size limits
railway volumes capacity
```

## Next Steps

1. **Test Manual Upload**: If you want to test immediately
   ```powershell
   railway volumes upload /data/models/stt/vosk-model-ar-0.22-linto-1.1.0 Python/voice_service/models/stt/vosk-model-ar-0.22-linto-1.1.0
   ```

2. **Verify Deployment**: Let automatic system handle it for production
   ```bash
   git push origin main  # Automatic upload via setup_voice_models.py
   ```

3. **Monitor Health**: Check that models are loaded correctly
   ```bash
   curl https://your-service.railway.app/health
   ```

---

**Note**: The automatic system is recommended for most deployments. Manual uploads with Railway CLI are useful for testing or one-time fixes.

**Created**: November 20, 2025
**Project**: Hana Voice SaaS
**Purpose**: Railway CLI model upload instructions
