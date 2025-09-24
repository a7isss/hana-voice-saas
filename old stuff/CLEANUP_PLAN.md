# Hana Voice SaaS - Documentation Cleanup Plan

## 📋 **CURRENT .MD FILES ANALYSIS**

### **Files to Keep (2-3 Core Documents):**
1. **README.md** - Main project overview and quick start guide
2. **TECHNICAL_SPECIFICATION.md** - Merged comprehensive technical documentation
3. **DEPLOYMENT_GUIDE.md** - Deployment and operations manual

### **Files to Merge and Delete:**
- ❌ `HANA_VOICE_SAAS_SPECIFICATION.md` → Merge into TECHNICAL_SPECIFICATION.md
- ❌ `HANA_VOICE_SAAS_AUDIT_REPORT.md` → Merge into TECHNICAL_SPECIFICATION.md  
- ❌ `PRODUCTION_READINESS_PLAN.md` → Merge into TECHNICAL_SPECIFICATION.md
- ❌ `CURRENT_SYSTEM_DOCUMENTATION.md` → Merge into TECHNICAL_SPECIFICATION.md
- ❌ `MIGRATION_PLAN_RENDER_PYTHON_TYPESCRIPT.md` → Merge into DEPLOYMENT_GUIDE.md
- ❌ `FRONTEND_MIGRATION_PLAN.md` → Merge into DEPLOYMENT_GUIDE.md
- ❌ `MIGRATION_IMPLEMENTATION_CHECKLIST.md` → Merge into DEPLOYMENT_GUIDE.md
- ❌ `POST_MIGRATION_CHECKLIST.md` → Merge into DEPLOYMENT_GUIDE.md
- ❌ `FINAL_STRUCTURE_REVIEW.md` → Merge into DEPLOYMENT_GUIDE.md
- ❌ `dashboard_implementation_plan.md` → Merge into TECHNICAL_SPECIFICATION.md

### **Files from Previous Version to Delete:**
- ❌ `free-nextjs-admin-dashboard-main/` - Old dashboard files
- ❌ `dashboard/` - Old React dashboard
- ❌ `src/` - Old monolithic structure
- ❌ `main.py` - Old entry point
- ❌ `requirements.txt` - Old dependencies
- ❌ `Dockerfile` - Old container config
- ❌ `docker-compose.yml` - Old compose file
- ❌ `test_basic_functionality.py` - Old tests
- ❌ `test_integration.py` - Old tests
- ❌ `production_checklist.py` - Old script
- ❌ `generate_audio_files.py` - Old script
- ❌ `setup_local_dev.py` - Old script
- ❌ `admin_scripts.sql` - Old database scripts
- ❌ `project-architecture.json` - Old architecture

## 🚀 **DOCKER FILES FOR RENDER**

### **Current Docker Files (Keep):**
- ✅ `api-service/Dockerfile` - API service container
- ✅ `voice-service/Dockerfile` - Voice processing service  
- ✅ `data-service/Dockerfile` - Data export service
- ✅ `Dockerfile.production` - Production optimization

### **Render Configuration:**
- ✅ `render.yaml` - Multi-service deployment configuration

## 🔧 **RENDER DEPLOYMENT SETTINGS**

### **Service Configuration in render.yaml:**
```yaml
services:
  # API Service (Main Gateway)
  - type: web
    name: hana-voice-api
    env: python
    plan: standard
    buildCommand: cd api-service && pip install -r requirements.txt
    startCommand: cd api-service && uvicorn src.main:app --host 0.0.0.0 --port $PORT

  # Voice Processing Service  
  - type: web
    name: hana-voice-service
    env: python
    plan: standard
    buildCommand: cd voice-service && pip install -r requirements.txt
    startCommand: cd voice-service && uvicorn src.main:app --host 0.0.0.0 --port $PORT

  # Data Processing Service
  - type: web
    name: hana-data-service
    env: python
    plan: standard
    buildCommand: cd data-service && pip install -r requirements.txt
    startCommand: cd data-service && uvicorn src.main:app --host 0.0.0.0 --port $PORT

  # Frontend (Next.js)
  - type: web
    name: hana-voice-frontend
    env: node
    plan: standard
    buildCommand: cd frontend && npm install && npm run build
    startCommand: cd frontend && npm start

databases:
  - name: hana-voice-db
    plan: standard
```

### **Required Environment Variables:**
```
# API Service
JWT_SECRET_KEY=your-secret-key
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
OPENAI_API_KEY=your-openai-key
FREEPBX_HOST=your-freepbx-host
FREEPBX_USERNAME=your-ami-username
FREEPBX_PASSWORD=your-ami-password

# Frontend
NEXT_PUBLIC_API_URL=https://hana-voice-api.onrender.com
NODE_ENV=production
```

## 📁 **CLEANUP EXECUTION STEPS**

1. **Create merged technical specification**
2. **Create merged deployment guide** 
3. **Delete unnecessary .md files**
4. **Delete old project files from previous version**
5. **Verify Docker file paths for Render**
6. **Update git repository**

Let's begin the cleanup process.
