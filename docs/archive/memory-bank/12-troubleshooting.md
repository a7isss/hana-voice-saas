# 12 - Troubleshooting

## 🚨 **Critical Issue Resolution**

### **Voice Processing Issues**

#### **STT Model Not Loading**
```bash
# Symptoms: "Model not found" errors
# Solution: Verify model directory

cd Python/voice_service
ls -la models/
# Should show: vosk-model-ar-0.22-linto-1.1.0/

# Test model loading
python -c "from vosk import Model; model = Model('models'); print('✅ STT model loaded')"
```

#### **Poor STT Accuracy**
```bash
# Symptoms: Incorrect Arabic transcription
# Solution: Check audio format and sample rate

# Verify audio format
ffmpeg -i input.webm -f wav -acodec pcm_s16le -ar 16000 -ac 1 output.wav

# Expected: 16000 Hz, mono, PCM S16LE
```

#### **TTS Slow First Run**
```bash
# Symptoms: First TTS call takes 2-5 minutes
# Solution: Models auto-download (~1GB) then cache

# Check TTS cache directory
python -c "import torch; print('Cache dir:', torch.hub.get_dir())"

# Expected: Subsequent calls <30 seconds
```

### **Service Communication Issues**

#### **WebSocket Connection Failures**
```javascript
// Symptoms: WebSocket connection errors
// Solution: Verify voice service running

// Test WebSocket connection
const ws = new WebSocket('ws://localhost:8000/ws/healthcare-questionnaire');
ws.onopen = () => console.log('✅ Connected to voice service');
ws.onerror = (e) => console.error('❌ Connection failed:', e);
```

#### **Health Check Failures**
```bash
# Symptoms: Health endpoints returning errors
# Solution: Check service status

# Test Next.js health
curl http://localhost:3000/api/health

# Test voice service health
curl http://localhost:8000/health

# Expected: {"status":"healthy","models_loaded":true}
```

### **Deployment Issues**

#### **Railway Build Failures**
```bash
# Symptoms: Railway deployment failing
# Solution: Check build logs and dependencies

# Verify TypeScript compilation
npx tsc --noEmit

# Verify Python dependencies
cd Python/voice_service && uv sync

# Check railway.toml configuration
cat railway.toml
```

#### **Voice Model Persistence Issues**
```bash
# Symptoms: Models re-downloading on each deploy
# Solution: Verify persistent volume mounting

# Check volume configuration in railway.toml
grep -A 5 "volumes" railway.toml

# Expected: Persistent volume mounted at /data/models
```

---

## 🔧 **Quick Fix Solutions**

### **Immediate Recovery Steps**

#### **Service Restart Procedure**
```bash
# Stop all services
pkill -f "uvicorn app.main:app"
pkill -f "npm run dev"

# Start voice service
cd Python/voice_service && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# Start Next.js
npm run dev &
```

#### **Model Reset Procedure**
```bash
# Clear TTS cache if needed
cd Python/voice_service
rm -rf ~/.cache/tts/  # Linux/Mac
rm -rf %USERPROFILE%\.cache\tts\  # Windows

# Verify STT model
ls -la models/vosk-model-ar-0.22-linto-1.1.0/
```

#### **Database Connection Reset**
```bash
# Check Supabase connection
curl "https://YOUR_PROJECT.supabase.co/rest/v1/?apikey=YOUR_ANON_KEY"

# Verify environment variables
cat .env.local | grep SUPABASE
```

### **Common Error Messages**

#### **"ModuleNotFoundError: No module named 'vosk'"**
```bash
# Solution: Install Python dependencies
cd Python/voice_service
uv sync

# Verify installation
python -c "import vosk; print('✅ Vosk installed')"
```

#### **"WebSocket connection failed"**
```bash
# Solution: Check voice service status
ps aux | grep uvicorn

# Restart voice service if needed
cd Python/voice_service && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### **"Model not found in models/"**
```bash
# Solution: Verify model directory structure
cd Python/voice_service
ls -la models/vosk-model-ar-0.22-linto-1.1.0/

# Expected: am/, conf/, graph/, ivector/, rescore/ directories
```

---

## 🐛 **Debugging Procedures**

### **Voice Processing Debugging**

#### **STT Debug Mode**
```python
# Enable verbose STT logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Test with known Arabic phrase
test_audio = "مرحبا أهلا وسهلا"
result = recognizer.Result()
print(f"STT Result: {result}")
```

#### **TTS Debug Mode**
```python
# Enable TTS debugging
import os
os.environ['TTS_VERBOSE'] = '1'

# Test TTS generation
tts.tts_to_file(text="مرحباً، هذا اختبار", file_path="debug.wav")
print("✅ TTS audio saved to debug.wav")
```

#### **Audio Pipeline Debugging**
```bash
# Test WebM to WAV conversion
ffmpeg -f webm -i input.webm -f wav -acodec pcm_s16le -ar 16000 -ac 1 debug.wav

# Verify audio properties
ffprobe debug.wav
```

### **WebSocket Debugging**

#### **WebSocket Connection Test**
```javascript
// Browser console test
const ws = new WebSocket('ws://localhost:8000/ws/healthcare-questionnaire');

ws.onopen = () => {
    console.log('✅ WebSocket connected');
    ws.send(JSON.stringify({type: 'test', message: 'connection test'}));
};

ws.onmessage = (e) => console.log('📨 Received:', e.data);
ws.onerror = (e) => console.error('❌ WebSocket error:', e);
ws.onclose = (e) => console.log('🔌 WebSocket closed:', e);
```

#### **WebSocket Message Flow**
```python
# Enable WebSocket message logging
@app.websocket("/ws/healthcare-questionnaire")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🔌 WebSocket connection established")
    
    try:
        while True:
            data = await websocket.receive_text()
            print(f"📨 Received: {data}")
            # Process message...
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
```

### **Performance Debugging**

#### **Memory Usage Monitoring**
```bash
# Monitor Python voice service memory
ps aux | grep uvicorn | grep -v grep

# Monitor Node.js memory usage
ps aux | grep node | grep -v grep

# Check system memory
free -h  # Linux/Mac
systeminfo | find "Available Physical Memory"  # Windows
```

#### **Response Time Analysis**
```python
# Add timing to voice processing
import time

async def process_voice_request(audio_data):
    start_time = time.time()
    
    # Process audio
    result = await process_audio(audio_data)
    
    end_time = time.time()
    processing_time = end_time - start_time
    
    print(f"⏱️ Voice processing time: {processing_time:.2f}s")
    
    if processing_time > 10:
        print("⚠️ Slow processing detected")
    
    return result
```

---

## 🔄 **Recovery Procedures**

### **Service Recovery**

#### **Complete Service Reset**
```bash
#!/bin/bash
# Complete service reset script

echo "🔄 Resetting Hana Voice SaaS services..."

# Stop all services
pkill -f "uvicorn app.main:app"
pkill -f "npm run dev"
pkill -f "next-server"

# Clear caches
rm -rf .next/
rm -rf Python/voice_service/__pycache__/

# Restart voice service
cd Python/voice_service
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
VOICE_PID=$!

# Restart Next.js
cd ../..
npm run dev &
NEXT_PID=$!

echo "✅ Services restarted (Voice: $VOICE_PID, Next.js: $NEXT_PID)"
```

#### **Database Recovery**
```sql
-- Reset telephony settings if needed
DELETE FROM telephony_settings;
INSERT INTO telephony_settings (id, telephony_token, is_active, created_at) 
VALUES (1, 'your-token-here', true, NOW());
```

### **Data Recovery**

#### **Voice Model Recovery**
```bash
# Re-download STT model if corrupted
cd Python/voice_service
rm -rf models/vosk-model-ar-0.22-linto-1.1.0/

# Download from source (if available)
# Note: Original model should be backed up
```

#### **Configuration Recovery**
```bash
# Restore environment variables
cp .env.local.example .env.local
# Edit .env.local with correct values

# Verify all required variables
cat .env.local | grep -E "(SUPABASE|JWT|VOICE_SERVICE|TELEPHONY)"
```

---

## 📊 **Monitoring & Alerting**

### **Health Monitoring**

#### **Automated Health Checks**
```bash
#!/bin/bash
# Health check script

# Check voice service
VOICE_HEALTH=$(curl -s http://localhost:8000/health | jq -r '.status')
# Check Next.js service
NEXT_HEALTH=$(curl -s http://localhost:3000/api/health | jq -r '.status')

if [ "$VOICE_HEALTH" != "healthy" ] || [ "$NEXT_HEALTH" != "healthy" ]; then
    echo "❌ Service health check failed"
    # Send alert or restart services
    exit 1
else
    echo "✅ All services healthy"
fi
```

#### **Performance Monitoring**
```python
# Performance monitoring in voice service
import psutil
import time

def monitor_performance():
    memory_usage = psutil.virtual_memory().percent
    cpu_usage = psutil.cpu_percent(interval=1)
    
    if memory_usage > 80:
        print(f"⚠️ High memory usage: {memory_usage}%")
    
    if cpu_usage > 90:
        print(f"⚠️ High CPU usage: {cpu_usage}%")
    
    return {
        "memory_usage": memory_usage,
        "cpu_usage": cpu_usage,
        "timestamp": time.time()
    }
```

### **Log Analysis**

#### **Error Pattern Detection**
```python
# Log error patterns for analysis
import logging
from collections import defaultdict

error_patterns = defaultdict(int)

def log_error_with_context(error_type, context):
    error_patterns[error_type] += 1
    logging.error(f"{error_type}: {context}")
    
    # Alert on frequent errors
    if error_patterns[error_type] > 10:
        print(f"🚨 Frequent error detected: {error_type}")
```

#### **WebSocket Connection Monitoring**
```python
# Monitor WebSocket connections
active_connections = 0
max_concurrent = 10

@app.websocket("/ws/healthcare-questionnaire")
async def websocket_endpoint(websocket: WebSocket):
    global active_connections
    
    if active_connections >= max_concurrent:
        await websocket.close(code=1008, reason="Too many connections")
        return
    
    active_connections += 1
    print(f"🔌 Active connections: {active_connections}")
    
    try:
        await websocket.accept()
        # Handle messages...
    finally:
        active_connections -= 1
        print(f"🔌 Active connections: {active_connections}")
```

---

## 🛠️ **Maintenance Procedures**

### **Regular Maintenance**

#### **Weekly Maintenance Tasks**
```bash
#!/bin/bash
# Weekly maintenance script

echo "🔧 Running weekly maintenance..."

# Clear temporary files
find . -name "*.tmp" -delete
find . -name "*.log" -mtime +7 -delete

# Update dependencies
npm update
cd Python/voice_service && uv sync

# Backup configuration
cp .env.local .env.local.backup
cp Python/voice_service/.env Python/voice_service/.env.backup

echo "✅ Weekly maintenance completed"
```

#### **Monthly Maintenance Tasks**
```bash
#!/bin/bash
# Monthly maintenance script

echo "🔧 Running monthly maintenance..."

# Clear old TTS cache
rm -rf ~/.cache/tts/old_models/

# Update voice models (if newer versions available)
# Note: Test thoroughly before updating models

# Database maintenance
# Check for orphaned records, optimize tables

echo "✅ Monthly maintenance completed"
```

### **Backup Procedures**

#### **Configuration Backup**
```bash
# Backup all configuration files
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
    .env.local \
    Python/voice_service/.env \
    railway.toml \
    memory-bank/
```

#### **Database Backup**
```sql
-- Regular database backups (via Supabase dashboard)
-- Enable automatic backups in Supabase
-- Test restore procedures regularly
```

---

## 🔒 **Security Troubleshooting**

### **Authentication Issues**

#### **JWT Token Problems**
```bash
# Symptoms: Authentication failures
# Solution: Verify JWT configuration

# Check JWT secret in environment
echo $JWT_SECRET_KEY

# Verify token generation/validation
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token": "your-token"}'
```

#### **Service-to-Service Authentication**
```bash
# Symptoms: Voice service communication failures
# Solution: Verify shared secret

# Check voice service secret
echo $VOICE_SERVICE_SECRET

# Test service communication
curl -H "X-Voice-Service-Secret: $VOICE_SERVICE_SECRET" \
  http://localhost:8000/health
```

### **Environment Security**

#### **Environment Variable Validation**
```bash
# Verify all required environment variables
required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "JWT_SECRET_KEY"
  "VOICE_SERVICE_SECRET"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing environment variable: $var"
  else
    echo "✅ $var is set"
  fi
done
```

#### **Security Audit**
```bash
# Check for exposed secrets
grep -r "password\|secret\|key" . --include="*.js" --include="*.ts" --include="*.py" | grep -v "//" | grep -v "#"
```

---

## 📞 **Support Resources**

### **Internal Documentation**
- `memory-bank/05-development-setup.md` - Development environment
- `memory-bank/06-voice-processing.md` - Voice model details
- `memory-bank/10-railway-deployment.md` - Production deployment

### **External Resources**
- [Vosk Documentation](https://alphacephei.com/vosk/) - STT troubleshooting
- [Coqui TTS Documentation](https://github.com/coqui-ai/TTS) - TTS issues
- [FastAPI Documentation](https://fastapi.tiangolo.com/) - Web framework
- [Railway Documentation](https://docs.railway.app/) - Deployment issues

### **Getting Help**
- **GitHub Issues**: Application-specific problems
- **Stack Overflow**: Technical questions
- **Discord Communities**: Voice AI development
- **Email Support**: Client-specific issues

---

## ✅ **Troubleshooting Checklist**

### **Before Contacting Support**
- [ ] Check service health endpoints
- [ ] Verify environment variables
- [ ] Check voice model loading
- [ ] Test WebSocket connections
- [ ] Review recent logs for errors
- [ ] Verify database connectivity
- [ ] Check system resource usage

### **Common Resolution Steps**
- [ ] Restart affected services
- [ ] Clear relevant caches
- [ ] Verify configuration files
- [ ] Check network connectivity
- [ ] Monitor system resources
- [ ] Review error logs

### **Prevention Measures**
- [ ] Regular health monitoring
- [ ] Automated backup procedures
- [ ] Regular dependency updates
- [ ] Performance monitoring
- [ ] Security audits
- [ ] Documentation updates

---

**Last Updated**: November 9, 2025  
**Troubleshooting Version**: 2.0  
**Next Review**: After major incidents or system changes
