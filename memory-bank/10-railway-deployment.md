# 10 - Railway Deployment

## 🚀 **Railway Migration & Deployment Guide**

### **Why Railway is Better for Voice Applications**

Railway offers significant advantages over Render for voice applications:

- **✅ Persistent Storage**: Built-in volume support for voice models
- **✅ Superior GitHub Integration**: Automatic deployments with previews
- **✅ Better Pricing**: More generous free tier and predictable costs
- **✅ Enhanced Developer Experience**: Faster builds and better monitoring
- **✅ Database Integration**: Seamless PostgreSQL and Redis support

---

## 📋 **Migration Checklist**

### **Pre-Migration Preparation**
- [ ] Create Railway account at [railway.app](https://railway.app)
- [ ] Connect GitHub account to Railway
- [ ] Install Railway GitHub app for repository
- [ ] Backup current Render deployment configuration
- [ ] Document current environment variables

### **Migration Steps**
- [ ] Deploy using `railway.toml` configuration
- [ ] Configure environment variables in Railway
- [ ] Set up persistent volume for voice models
- [ ] Test both services (Next.js + Python)
- [ ] Update external service URLs if needed
- [ ] Decommission Render services

### **Post-Migration Verification**
- [ ] Health checks passing for both services
- [ ] Voice models loading correctly
- [ ] WebSocket connections working
- [ ] Database connectivity verified
- [ ] Performance metrics monitored

---

## 🔧 **Railway Configuration**

### **railway.toml Configuration**
```toml
# railway.toml - Multi-service configuration
[build]
builder = "nixpacks"

[deploy]
numReplicas = 1
restartPolicyType = "ON_FAILURE"

# Next.js Service
[[services]]
name = "hana-voice-saas"
source = "."

[services.env]
NODE_ENV = "production"
PORT = "3000"

[services.build]
command = "npm run build"

[services.start]
command = "npm start"

[services.healthCheck]
path = "/api/health"
initialDelay = 30
period = 60
timeout = 10

# Python Voice Service
[[services]]
name = "hana-voice-service"
source = "./Python/voice_service"

[services.env]
PORT = "8000"

[services.build]
command = "uv sync"

[services.start]
command = "uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"

[services.healthCheck]
path = "/health"
initialDelay = 60
period = 60
timeout = 10

# Persistent Volume for Voice Models
[[volumes]]
name = "voice-models"
mountPath = "/data/models"
service = "hana-voice-service"
```

### **Environment Variables**

#### **Next.js Service Variables**
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://hana-voice-saas.up.railway.app
VOICE_SERVICE_URL=https://hana-voice-service.up.railway.app
VOICE_SERVICE_SECRET=hana_voice_shared_secret_2024_secure_key
ADMIN_USERNAME=hana_admin_2024
ADMIN_PASSWORD=your_secure_password_here
JWT_SECRET_KEY=your_jwt_secret_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### **Python Service Variables**
```env
VOICE_SERVICE_SECRET=hana_voice_shared_secret_2024_secure_key
VOICE_SERVICE_TOKEN=your_generated_token_here
LOG_LEVEL=INFO
MAX_CONCURRENT_SESSIONS=10
RATE_LIMIT_PER_MINUTE=60
VOSK_MODEL_PATH=/data/models/vosk-model-ar-0.22-linto-1.1.0
```

---

## 🚀 **Deployment Methods**

### **Method 1: Railway Dashboard (Recommended)**
1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway automatically detects `railway.toml` and deploys both services

### **Method 2: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# Deploy the project
railway up

# Check deployment status
railway status

# View logs
railway logs
```

### **Method 3: GitHub Integration**
1. Install Railway GitHub app
2. Connect repository
3. Automatic deployments on git push to main branch
4. Preview deployments for pull requests

---

## 💾 **Persistent Storage Setup**

### **Voice Models Volume Configuration**
1. **In Railway dashboard**, go to your Python service
2. **Click "Storage"** tab
3. **Create new Volume** named "voice-models"
4. **Mount path**: `/data/models`
5. **Service**: hana-voice-service

### **Voice Model Deployment**
```bash
# Voice models will be stored in persistent volume
/models/
├── vosk-model-ar-0.22-linto-1.1.0/
│   ├── am/          # Acoustic model
│   ├── conf/        # Configuration
│   ├── graph/       # Language model
│   ├── ivector/     # Speaker identification
│   └── rescore/     # Grammar rescoring
└── tts/             # Coqui TTS cache (auto-created)
```

### **Model Persistence Benefits**
- **✅ Models survive deployments**: No re-downloading on each deploy
- **✅ Faster startup**: Models ready immediately
- **✅ Cost savings**: No bandwidth charges for model downloads
- **✅ Reliability**: Consistent model availability

---

## 🔌 **Service Communication**

### **Internal Service URLs**
```typescript
// Next.js service communicates with Python service
const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'https://hana-voice-service.up.railway.app';

// WebSocket connections for voice processing
const WEBSOCKET_URL = `${VOICE_SERVICE_URL.replace('https', 'wss')}/ws/healthcare-questionnaire`;
```

### **Health Check Configuration**
```typescript
// Next.js health check
GET /api/health
// Response: { "status": "healthy", "services": { "voice": "connected" } }

// Python service health check  
GET /health
// Response: { "status": "healthy", "models_loaded": true }
```

### **CORS Configuration**
```python
# In Python voice service
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://hana-voice-saas.up.railway.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📊 **Performance & Scaling**

### **Resource Allocation**
```toml
# railway.toml resource configuration
[services]
# Next.js Service
[services.resources]
cpu = 1024
memory = 2048

# Python Service (higher memory for voice models)
[services.resources]  
cpu = 1024
memory = 4096
```

### **Scaling Considerations**
- **Voice Service**: Stateful (WebSocket connections) - vertical scaling
- **Next.js Service**: Stateless API routes - horizontal scaling
- **Database**: Supabase auto-scaling PostgreSQL
- **CDN**: Railway CDN for static assets

### **Performance Optimization**
- **Voice Model Caching**: Persistent volume eliminates download time
- **Database Connection Pooling**: Optimized Supabase connections
- **Asset Optimization**: Next.js automatic code splitting
- **CDN Caching**: Static assets delivered via CDN

---

## 🔒 **Security Configuration**

### **Environment Security**
- **Never commit secrets**: Use Railway environment variables
- **Secure tokens**: Rotate API keys and secrets regularly
- **HTTPS enforcement**: All communications over SSL/TLS
- **CORS restrictions**: Limit origins to your domains

### **Network Security**
```toml
# railway.toml network configuration
[services]
[services.ports]
port = 3000
protocol = "http"

[services.ports]  
port = 8000
protocol = "http"
```

### **Authentication Security**
- **JWT tokens**: Secure service-to-service communication
- **API keys**: Per-client authentication with rate limiting
- **WebSocket tokens**: Pre-shared tokens for telephony integration
- **Database security**: Supabase Row Level Security (RLS)

---

## 📈 **Monitoring & Observability**

### **Railway Dashboard Metrics**
- **CPU Usage**: Monitor voice processing load
- **Memory Usage**: Track model memory consumption
- **Network I/O**: WebSocket connection monitoring
- **Deployment History**: Track changes and rollbacks

### **Health Check Monitoring**
```bash
# Automated health checks
curl https://hana-voice-saas.up.railway.app/api/health
curl https://hana-voice-service.up.railway.app/health

# Expected responses
{
  "status": "healthy",
  "voice_service": "connected",
  "database": "connected"
}
```

### **Logging Strategy**
```python
# Structured logging in Python service
import logging
import json

logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}'
)
```

---

## 🐛 **Troubleshooting Deployment**

### **Common Deployment Issues**

#### **Build Failures**
```bash
# Check build logs in Railway dashboard
# Common issues:
# - Missing dependencies in package.json
# - TypeScript compilation errors
# - Python package conflicts
```

#### **Service Communication Issues**
```bash
# Test service connectivity
curl https://hana-voice-service.up.railway.app/health
# If fails, check:
# - Environment variables set correctly
# - CORS configuration
# - Network security groups
```

#### **Voice Model Loading Issues**
```bash
# Check volume mounting
railway volumes list
railway volumes info voice-models

# Verify model paths
ls -la /data/models/
```

#### **WebSocket Connection Issues**
```javascript
// Test WebSocket connection
const ws = new WebSocket('wss://hana-voice-service.up.railway.app/ws/healthcare-questionnaire');
ws.onopen = () => console.log('Connected');
ws.onerror = (e) => console.error('Error:', e);
```

### **Debugging Steps**
1. **Check Railway logs**: `railway logs` or dashboard logs
2. **Verify environment variables**: All required variables set
3. **Test health endpoints**: Both services responding
4. **Check volume mounting**: Voice models accessible
5. **Monitor resource usage**: CPU and memory within limits

---

## 💰 **Cost Management**

### **Railway Pricing**
- **Free Tier**: Generous limits for development and testing
- **Usage-Based**: Pay for actual resource consumption
- **Predictable**: No surprise charges with resource limits
- **Cost Comparison**: 50-70% cheaper than Render for similar resources

### **Cost Optimization**
- **Right-size resources**: Match CPU/memory to actual needs
- **Use free tier**: Development and testing on free plan
- **Monitor usage**: Set alerts for resource consumption
- **Optimize builds**: Faster builds reduce compute time

### **Budget Monitoring**
- Set monthly spending limits in Railway dashboard
- Monitor resource usage trends
- Optimize voice model storage
- Use CDN for static assets to reduce compute costs

---

## 🔄 **CI/CD Pipeline**

### **Automated Deployment Flow**
1. **Git Push**: Code pushed to main branch
2. **GitHub Actions**: Run tests and linting
3. **Railway Build**: Automatic build triggered
4. **Health Checks**: Post-deployment verification
5. **Rollback**: Automatic on health check failures

### **GitHub Actions Integration**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railway-org/action@v1
        with:
          token: ${{ secrets.RAILWAY_TOKEN }}
```

### **Quality Gates**
- **TypeScript compilation**: No type errors
- **Test coverage**: Minimum 80% test coverage
- **Linting**: ESLint and Prettier compliance
- **Security scanning**: Dependency vulnerability checks

---

## 🌐 **Custom Domains**

### **Domain Configuration**
1. **In Railway dashboard**, go to service settings
2. **Click "Custom Domains"**
3. **Add your domain** (e.g., voice.yourcompany.com)
4. **Follow DNS configuration** instructions

### **SSL Certificate**
- **Automatic SSL**: Railway provides free SSL certificates
- **Certificate renewal**: Automatic 90-day renewal
- **HTTPS enforcement**: All traffic redirected to HTTPS

### **DNS Configuration**
```dns
# CNAME record for custom domain
voice.yourcompany.com. CNAME cname.railway.app.
```

---

## 🚨 **Emergency Procedures**

### **Rollback Process**
```bash
# Rollback to previous deployment
railway rollback

# Or use Railway dashboard
# Deployments → Select previous version → Promote
```

### **Service Recovery**
1. **Check health endpoints**: Identify failing service
2. **Review logs**: `railway logs` for error details
3. **Restart service**: `railway restart [service-name]`
4. **Scale resources**: Increase CPU/memory if needed
5. **Contact support**: Railway support for platform issues

### **Data Backup**
- **Database**: Supabase automatic backups
- **Voice models**: Persistent volume backups
- **Configuration**: Environment variable exports
- **Code**: GitHub repository as backup

---

## 📞 **Support Resources**

### **Railway Documentation**
- [Railway Docs](https://docs.railway.app) - Comprehensive guides
- [Railway Discord](https://discord.gg/railway) - Community support
- [GitHub Issues](https://github.com/railwayapp/issues) - Bug reports

### **Project Documentation**
- `memory-bank/12-troubleshooting.md` - Common issues and solutions
- `memory-bank/05-development-setup.md` - Development environment
- `memory-bank/06-voice-processing.md` - Voice model details

### **Getting Help**
- **Railway Support**: Platform and deployment issues
- **GitHub Issues**: Application-specific problems
- **Community Discord**: Technical questions and best practices
- **Email Support**: Client and business inquiries

---

## ✅ **Post-Deployment Checklist**

### **Immediate Verification**
- [ ] Both services deployed and running
- [ ] Health checks passing for all endpoints
- [ ] Voice models loaded from persistent volume
- [ ] WebSocket connections established
- [ ] Database connectivity verified

### **Functional Testing**
- [ ] Arabic voice processing working
- [ ] Survey questionnaire functionality
- [ ] Telephony integration tested
- [ ] Data export and reporting
- [ ] Authentication and security

### **Performance Validation**
- [ ] Voice response times under 5 seconds
- [ ] Memory usage within acceptable limits
- [ ] Concurrent call capacity verified
- [ ] Database performance optimized
- [ ] CDN delivery working

### **Monitoring Setup**
- [ ] Health check monitoring configured
- [ ] Error tracking and alerting
- [ ] Performance metrics collection
- [ ] Log aggregation and analysis
- [ ] Cost monitoring and alerts

---

**Last Updated**: November 9, 2025  
**Deployment Version**: 2.0  
**Next Review**: After major infrastructure changes
