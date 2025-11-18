# Railway Volume Mount Paths - Voice Models

## ✅ Mount Path for Railway Volume

**Mount Path**: `/data`

## 📁 Required Folder Structure

Your Railway volume should have this exact structure:

```
/data/
├── models/
│   ├── stt/
│   │   └── vosk-model-ar-0.22-linto-1.1.0/
│   │       ├── am/
│   │       ├── conf/
│   │       ├── graph/
│   │       ├── ivector/
│   │       └── rescore/
│   └── tts/
│       └── tts_models--multilingual--multi-dataset--xtts_v2/
│           ├── config.json
│           ├── files.txt
│           ├── model.pth
│           ├── phonemes.json
│           ├── speakers.json
│           └── ...
```

## 🎯 What Each Model Needs

### 1. Vosk Arabic STT Model (~500MB)
**Folder**: `models/stt/vosk-model-ar-0.22-linto-1.1.0/`
**Contains**: `am/`, `conf/`, `graph/`, `ivector/`, `rescore/` folders

### 2. Coqui XTTS TTS Model (~1GB)  
**Folder**: `models/tts/tts_models--multilingual--multi-dataset--xtts_v2/`
**Contains**: `config.json`, `model.pth`, `files.txt`, `phonemes.json`, `speakers.json`, etc.

## 🔧 How the Service Uses These Paths

The Python service code is already configured to look for models in this order:

1. **Persistent Storage** (Railway Volume): `/data/models/...`
2. **Local Fallback**: `models/...`
3. **Download Fallback**: Download if not found locally

## 📤 Upload Process

1. **Create Railway Volume** (if not done already)
2. **Mount to**: `/data`
3. **Upload the model folders** to match the structure above
4. **Redeploy the service**

## ⚙️ Environment Variables (Already Set)

These are already configured in `railway.toml`:

```bash
VOSK_MODEL_PATH=models/vosk-model-ar-0.22-linto-1.1.0
TTS_MODEL_NAME=tts_models/multilingual/multi-dataset/xtts_v2
```

The service will automatically prepend `/data/` to these paths.

## ✅ Quick Verification

After uploading your models, you can verify the structure:

```bash
# SSH into your Railway service (via Railway dashboard)
ls /data/models/stt/vosk-model-ar-0.22-linto-1.1.0
ls /data/models/tts/tts_models--multilingual--multi-dataset--xtts_v2
```

## 🎉 Expected Result

With models properly mounted at `/data`, your voice service will:

1. ✅ Load Vosk Arabic STT model from `/data/models/stt/vosk-model-ar-0.22-linto-1.1.0`
2. ✅ Load Coqui XTTS TTS model from `/data/models/tts/tts_models--multilingual--multi-dataset--xtts_v2`
3. ✅ Health check will show both models as "healthy"
4. ✅ WebSocket voice processing will work end-to-end

---

**Mount Path**: `/data`  
**Total Models Size**: ~1.5GB  
**Status**: Service code is pre-configured for this path
