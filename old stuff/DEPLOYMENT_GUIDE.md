# Hana Voice SaaS - Complete Deployment Guide

## 🚀 **QUICK START DEPLOYMENT**

### **One-Click Render Deployment (Recommended)**
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

**Steps:**
1. Click the "Deploy to Render" button above
2. Connect your GitHub repository
3. Render will automatically detect the `render.yaml` configuration
4. Set the required environment variables in Render dashboard

### **Manual Deployment Setup**
```bash
# Clone the repository
git clone https://github.com/a7isss/hana-voice-saas.git
cd hana-voice-saas

# Set up environment variables
cp config/environment.example .env
# Edit .env with your actual API keys and settings

# Deploy to Render
# Connect your GitHub repository to Render
# Render will automatically deploy all services
```

---

## 📋 **PREREQUISITES**

### **Required Accounts**
- **Supabase Account**: For database and authentication ([supabase.com](https://supabase.com))
- **OpenAI API Key**: For voice processing ([platform.openai.com](https://platform.openai.com))
- **Render Account**: For deployment ([render.com](https://render.com))
- **FreePBX Server**: Optional, for telephony integration

### **Technical Requirements**
- **GitHub Repository**: Code must be pushed to GitHub
- **Domain**: Optional custom domain for production
- **SSL Certificate**: Automatically provided by Render

---

## 🏗️ **ARCHITECTURE MIGRATION SUMMARY**

### **From Monolithic to Microservices**
**Previous Architecture:**
- Single FastAPI application (`main.py`)
- React dashboard in `dashboard/` directory
- Direct PostgreSQL connection

**Current Architecture:**
- **API Service**: FastAPI gateway (`api-service/`)
- **Voice Service**: TTS/STT processing (`voice-service/`)
- **Data Service**: Excel export (`data-service/`)
- **Frontend**: Next.js 15 dashboard (`frontend/`)
- **Supabase Integration**: Scalable database and auth

### **Key Benefits of New Architecture**
- **Scalability**: Independent service scaling
- **Maintainability**: Clear separation of concerns
- **Performance**: Optimized resource allocation
- **Reliability**: Service isolation prevents cascading failures

---

## 🔧 **ENVIRONMENT CONFIGURATION**

### **Environment Variables Setup**

#### **API Service Configuration**
```bash
JWT_SECRET_KEY=your-super-secret-jwt-key
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
FREEPBX_HOST=your-freepbx-server
FREEPBX_USERNAME=your-ami-username
FREEPBX_PASSWORD=your-ami-password
```

#### **Voice Service Configuration**
```bash
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-anon-key
```

#### **Frontend Configuration**
```bash
NEXT_PUBLIC_API_URL=https://hana-voice-api.onrender.com
NODE_ENV=production
```

### **Local Development Setup**
```bash
# Copy environment template
cp config/environment.example .env

# Fill in your actual values
# Use development keys for local testing
```

---

## 🗃️ **DATABASE SETUP**

### **Supabase Configuration**
1. **Create new project** at [supabase.com](https://supabase.com)
2. **Get connection details** from Project Settings → Database
3. **Run the schema:**
   ```sql
   -- Copy and paste the content of supabase_schema.sql
   -- into the Supabase SQL editor and run it
   ```

### **Database Tables Created**
- `profiles` - User accounts and credits
- `institutions` - Healthcare clients
- `customers` - Patients for calling
- `survey_responses` - Voice survey results
- `call_logs` - Call analytics
- `credit_transactions` - Billing history
- `audio_files` - Cached TTS audio

### **Row Level Security (RLS)**
- **Enabled by default** for data protection
- **Policies configured** for multi-tenant isolation
- **Admin access** for super admin operations

---

## 🌐 **RENDER DEPLOYMENT CONFIGURATION**

### **Multi-Service Architecture in render.yaml**
```yaml
services:
  # API Service (Main Gateway)
  - type: web
    name: hana-voice-api
    env: python
    plan: standard
    buildCommand: cd api-service && pip install -r requirements.txt
    startCommand: cd api-service && uvicorn src.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health

  # Voice Processing Service
  - type: web
    name: hana-voice-service
    env: python
    plan: standard
    buildCommand: cd voice-service && pip install -r requirements.txt
    startCommand: cd voice-service && uvicorn src.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health

  # Data Processing Service
  - type: web
    name: hana-data-service
    env: python
    plan: standard
    buildCommand: cd data-service && pip install -r requirements.txt
    startCommand: cd data-service && uvicorn src.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health

  # Frontend (Next.js)
  - type: web
    name: hana-voice-frontend
    env: node
    plan: standard
    buildCommand: cd frontend && npm install && npm run build
    startCommand: cd frontend && npm start
    healthCheckPath: /

databases:
  - name: hana-voice-db
    plan: standard
    databaseName: hana_voice
```

### **Render Dashboard Setup**
1. **Connect GitHub repository** to Render
2. **Auto-detection**: Render will detect `render.yaml`
3. **Environment variables**: Set in Render dashboard for each service
4. **Custom domain**: Optional domain setup

---

## 🐳 **DOCKER CONFIGURATION**

### **Service Docker Files**
- **API Service**: `api-service/Dockerfile`
- **Voice Service**: `voice-service/Dockerfile`
- **Data Service**: `data-service/Dockerfile`
- **Production Optimization**: `Dockerfile.production`

### **Docker Compose for Local Development**
```yaml
# docker-compose.yml
version: '3.8'
services:
  api-service:
    build: ./api-service
    ports:
      - "8000:8000"
    environment:
      - JWT_SECRET_KEY=dev-secret
      - SUPABASE_URL=your-supabase-url
      - SUPABASE_KEY=your-supabase-key

  voice-service:
    build: ./voice-service
    ports:
      - "8001:8001"
    environment:
      - OPENAI_API_KEY=your-openai-key

  data-service:
    build: ./data-service
    ports:
      - "8002:8002"

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🔒 **SECURITY CONFIGURATION**

### **Essential Security Steps**
1. **Generate strong JWT secret** (Render will auto-generate)
2. **Use HTTPS only** (enforced by Render)
3. **Set up CORS properly** for your frontend domain
4. **Implement rate limiting** in production
5. **Regularly rotate API keys**

### **Production Security Settings**
```bash
# Production security settings
ENVIRONMENT=production
LOG_LEVEL=WARNING  # Reduce verbose logging in production
JWT_SECRET_KEY=very-long-random-string  # 64+ characters
```

### **Environment Security**
- **Secrets management** via Render environment variables
- **No hardcoded credentials** in source code
- **Database connection strings** securely managed
- **API keys** stored as secrets

---

## 📊 **MONITORING & ANALYTICS**

### **Render Dashboard Features**
- **Real-time logs** for each service
- **Performance metrics** (CPU, memory, response times)
- **Health checks** automatic monitoring
- **Auto-scaling** based on traffic

### **Custom Monitoring**
- **Health check endpoints**: `/health` for each service
- **Service status** monitoring
- **Database connection** monitoring
- **Error tracking** and alerting

### **Health Check Endpoints**
- API Service: `https://hana-voice-api.onrender.com/health`
- Voice Service: `https://hana-voice-service.onrender.com/health`
- Data Service: `https://hana-data-service.onrender.com/health`
- Frontend: Built-in Next.js health checks

---

## 💰 **COST OPTIMIZATION**

### **Render Pricing Tiers**
- **Free Tier**: Good for development and testing
- **Standard Tier**: Recommended for production ($25-50/month)
- **Pro Tier**: High traffic applications ($50-250/month)

### **Cost-Saving Tips**
- Use Free tier for development
- Scale down during low-traffic hours
- Use Supabase free tier for small projects
- Monitor OpenAI API usage to control costs

### **OpenAI Cost Management**
- **Audio caching** to reduce TTS API calls
- **Efficient calling** with smart retry logic
- **Batch processing** for optimized data exports
- **Usage monitoring** to prevent unexpected charges

---

## 🚨 **TROUBLESHOOTING**

### **Common Deployment Issues**

#### **Build Failures**
```bash
# Check build logs in Render dashboard
# Common issues: missing dependencies, syntax errors
```

#### **Database Connection Issues**
```bash
# Verify SUPABASE_URL and SUPABASE_KEY
# Check Supabase project status
# Test connection from local environment first
```

#### **Service Communication Issues**
```bash
# Verify service URLs in environment variables
# Check CORS settings
# Test health check endpoints
```

### **Health Check Endpoints**
- API Service: `https://hana-voice-api.onrender.com/health`
- Voice Service: `https://hana-voice-service.onrender.com/health`
- Data Service: `https://hana-data-service.onrender.com/health`

### **Log Access**
- **Render dashboard** for service logs
- **Supabase logs** for database operations
- **OpenAI usage** for API cost tracking

---

## 🔄 **CI/CD PIPELINE**

### **Automatic Deploys**
- Push to `main` branch triggers automatic deployment
- Each service deploys independently
- Health checks ensure successful deployment
- Rollback on failure automatically

### **Manual Deploys**
- Trigger via Render dashboard
- Deploy specific commits
- Preview deployments for testing

### **GitHub Integration**
- **Repository connection** for automatic deployments
- **Branch protection** for production stability
- **Pull request previews** for testing

---

## 📞 **SUPPORT & MAINTENANCE**

### **Daily Monitoring**
- Check service health endpoints
- Monitor credit usage and billing
- Review error logs for issues
- Backup database regularly

### **Monthly Maintenance**
- Update dependencies
- Review security settings
- Optimize performance
- Backup and archive old data

### **Emergency Procedures**
- **System down**: Switch to backup OpenAI keys
- **Audio issues**: Regenerate corrupted files
- **Database problems**: Use Supabase point-in-time restore
- **Telephony issues**: Check FreePBX logs, restart services

---

## 🎯 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment Checklist**
- [ ] Create Supabase project and run schema
- [ ] Obtain OpenAI API key
- [ ] Configure FreePBX server (if using telephony)
- [ ] Set up custom domain (optional)
- [ ] Push code to GitHub repository

### **Environment Setup Checklist**
- [ ] Set environment variables in Render dashboard
- [ ] Verify Supabase database connection
- [ ] Test OpenAI API key functionality
- [ ] Configure telephony settings (if applicable)

### **Post-Deployment Verification**
- [ ] All services deploy without errors
- [ ] Health checks pass (green status)
- [ ] Database connections work
- [ ] Frontend loads correctly
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] Voice processing functional

### **Production Readiness Checklist**
- [ ] Security configuration completed
- [ ] Monitoring and alerting set up
- [ ] Backup procedures implemented
- [ ] Performance testing completed
- [ ] Documentation updated

---

## 📈 **PERFORMANCE TARGETS**

### **Target Performance Metrics**
- **API response time**: < 200ms
- **Service uptime**: > 99.5%
- **Voice processing latency**: < 2 seconds
- **Concurrent user support**: 50+ users

### **Scalability Testing**
- **Horizontal scaling** with multiple service instances
- **Load balancing** across Render services
- **Database optimization** for high concurrency
- **CDN integration** for static assets

---

## 🤝 **SUPPORT RESOURCES**

### **Documentation**
- **Technical Specification**: `TECHNICAL_SPECIFICATION.md`
- **README**: `README.md` for quick start
- **GitHub Repository**: Issue tracking and source code

### **Community Support**
- **GitHub Issues** for bug reports and feature requests
- **Render Documentation** for deployment questions
- **Supabase Documentation** for database operations

### **Professional Support**
- **Custom development** available
- **Enterprise features** on request
- **Training and onboarding** services

---

**Status**: Ready for Production Deployment 🚀

This deployment guide provides complete instructions for deploying Hana Voice SaaS to Render cloud platform, including environment setup, security configuration, monitoring, and troubleshooting procedures.
