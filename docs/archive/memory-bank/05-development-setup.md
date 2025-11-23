# 05 - Development Setup

## 🚀 **Quick Start Guide**

### **5-Minute Setup**
```bash
# 1. Clone and install
git clone https://github.com/a7isss/hana-voice-saas.git
cd hana-voice-saas
npm install

# 2. Environment setup
cp .env.local.example .env.local
# Edit .env.local with your values

# 3. Start development
npm run dev
```

### **Prerequisites Checklist**
- [ ] Node.js 18.x or later
- [ ] Python 3.11+ for voice processing
- [ ] Supabase account and project
- [ ] 3GB+ available RAM for voice models
- [ ] 5GB+ available disk space

---

## 🔧 **Environment Configuration**

### **Required Environment Variables**
```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Authentication Configuration (Required)
JWT_SECRET_KEY=your_secure_jwt_secret_key_here

# Python Voice Service (Required)
VOICE_SERVICE_SECRET=your_voice_service_secret_key
VOICE_SERVICE_TOKEN=jwt_secret_for_voice_service

# Telephony Integration (Optional)
TELEPHONY_TOKEN=pre-shared-token-from-maqsam
```

### **Getting Supabase Credentials**
1. Create project at [Supabase](https://supabase.com)
2. Navigate to Settings → API
3. Copy Project URL and anon public key
4. Import database schema from `supabase_schema.sql`

### **Getting Maqsam Telephony Token**
1. Sign up with Maqsam telephony service
2. Obtain API key or pre-shared token
3. Add TELEPHONY_TOKEN to environment variables

---

## 🐍 **Python Voice Service Setup**

### **Install Python Dependencies**
```bash
cd Python/voice_service

# Install with uv (recommended)
uv sync

# Or with pip
pip install -r requirements.txt
```

### **Voice Model Setup**
```bash
# Verify model directory structure
ls -la Python/voice_service/models/
# Should show: vosk-model-ar-0.22-linto-1.1.0/ directory

# Test model loading
python -c "from vosk import Model; model = Model('models'); print('✅ STT model loaded')"
```

### **Start Voice Service**
```bash
cd Python/voice_service

# Development mode with auto-reload
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### **Voice Service Health Check**
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","voice_service":"loaded","models_loaded":true}
```

---

## ⚛️ **Next.js Development**

### **Start Development Server**
```bash
# From project root
npm run dev

# Or with specific port
npm run dev -- -p 3001
```

### **Development URLs**
- **Main App**: http://localhost:3000
- **Voice Tester**: http://localhost:3000/voice-tester
- **API Docs**: http://localhost:8000/docs (voice service)
- **Health Check**: http://localhost:3000/api/health

### **Common Development Commands**
```bash
# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

---

## 🧪 **Testing Setup**

### **Voice Model Testing**
```bash
cd Python/voice_service

# Run comprehensive model tests
python tests/test_models_simple.py

# Expected output:
# ✅ Vosk imported successfully!
# ✅ Coqui TTS imported successfully!
# ✅ Arabic Vosk model loaded successfully!
# ✅ TTS basic functionality working
```

### **API Testing**
```bash
# Test Next.js API health
curl http://localhost:3000/api/health

# Test voice service health
curl http://localhost:8000/health

# Test authentication
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"validate"}'
```

### **WebSocket Testing**
```javascript
// Browser console test
const ws = new WebSocket('ws://localhost:8000/ws/healthcare-questionnaire');
ws.onopen = () => console.log('✅ Connected to voice service');
ws.onmessage = (e) => console.log('📨 Received:', e.data);
```

---

## 🐳 **Docker Setup (Alternative)**

### **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - .:/app
      - /app/node_modules
```

### **Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔌 **Integration Testing**

### **Complete Local Development Setup**

#### **Terminal 1: Voice Service**
```bash
cd Python/voice_service
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### **Terminal 2: Next.js App**
```bash
npm run dev
```

#### **Terminal 3: Verification Tests**
```bash
# Test voice service
curl http://localhost:8000/health

# Test Next.js
curl http://localhost:3000/api/health

# Test WebSocket connection
node run_model_test.js
```

### **Testing Complete Setup**
1. **Access Admin Dashboard**: http://localhost:3000
2. **Login**: Use demo credentials
3. **Test Voice**: Navigate to voice-tester page
4. **Verify Arabic**: Test Arabic voice interactions

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Port Conflicts**
```bash
# Check port usage
netstat -an | find "3000"
netstat -an | find "8000"

# Kill conflicting processes
taskkill /PID <pid> /F
```

#### **Python Environment Issues**
```bash
# Check Python version
python --version

# Verify uv installation
uv --version

# Reinstall dependencies
uv sync --reinstall
```

#### **Voice Model Issues**
```bash
# Check model directory
ls -la Python/voice_service/models/

# Verify model path
cat Python/voice_service/.env | grep VOSK_MODEL_PATH

# Expected: VOSK_MODEL_PATH=models/vosk-model-ar-0.22-linto-1.1.0
```

#### **Next.js Build Issues**
```bash
# Clear cache and rebuild
rm -rf .next/
npm run build

# Clear npm cache
npm cache clean --force
npm install
```

### **Error Messages & Solutions**

| Error | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'vosk'` | Run `uv sync` in voice_service directory |
| `Model not found` | Verify models directory exists with STT files |
| `WebSocket connection failed` | Check voice service running on port 8000 |
| `TTS models not available` | First TTS call auto-downloads models |

---

## 📋 **Development Checklist**

### **Pre-Development**
- [ ] Node.js 18.x+ installed
- [ ] Python 3.11+ installed
- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Voice models downloaded

### **Development Session**
- [ ] Voice service started on port 8000
- [ ] Next.js dev server started on port 3000
- [ ] Database connection verified
- [ ] Voice models loaded successfully
- [ ] WebSocket connections established

### **Post-Development**
- [ ] Code committed to Git
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Memory bank context preserved

---

## 🔒 **Security Considerations**

### **Development Security**
- Never commit `.env.local` to version control
- Use different keys for development and production
- Regularly rotate API keys and secrets
- Monitor for security vulnerabilities

### **Environment Security**
```bash
# Set secure permissions for environment files
chmod 600 .env.local
chmod 600 Python/voice_service/.env
```

### **Database Security**
- Enable Row Level Security (RLS) in Supabase
- Create appropriate security policies
- Regular database backups
- Monitor for suspicious activity

---

## 🚀 **Production Preparation**

### **Build Optimization**
```bash
# Production build
npm run build

# Analyze bundle size
npm run analyze

# Type checking
npx tsc --noEmit
```

### **Deployment Checklist**
- [ ] Environment variables configured for production
- [ ] Database migrations applied
- [ ] Voice models persisted in storage
- [ ] Health checks passing
- [ ] SSL certificates valid
- [ ] Monitoring and alerts configured

### **Performance Testing**
- Voice response times under 5 seconds
- Memory usage within acceptable limits
- Concurrent call capacity verified
- Database query performance optimized

---

## 📞 **Support Resources**

### **Documentation**
- `memory-bank/index.md` - Main documentation index
- `memory-bank/06-voice-processing.md` - Voice model details
- `memory-bank/12-troubleshooting.md` - Common issues and solutions

### **External Resources**
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vosk Model Documentation](https://alphacephei.com/vosk/models)
- [Coqui TTS Documentation](https://github.com/coqui-ai/TTS)

### **Getting Help**
- GitHub Issues for bug reports
- Stack Overflow for technical questions
- Memory bank for project context
- Email support for client issues

---

## 🔄 **Development Workflow**

### **Daily Development**
1. Start voice service (`cd Python/voice_service && uv run uvicorn app.main:app`)
2. Start Next.js dev server (`npm run dev`)
3. Test changes locally
4. Commit and push changes
5. Verify production deployment

### **Feature Development**
1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Create pull request
5. Deploy to production after review

### **Quality Assurance**
- TypeScript compilation without errors
- All tests passing
- Code linting and formatting
- Documentation updated
- Memory bank context preserved

---

**Last Updated**: November 9, 2025  
**Setup Version**: 2.1  
**Next Review**: After technology stack changes
