# Local Railway Deployment Testing Guide

This guide helps you test your Hana Voice SaaS application locally using the same environment as Railway deployment.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- Python 3.11+ installed (for voice service)
- UV package manager (optional but recommended for Python)

### Setup Steps

1. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.local.example .env.local
   
   # Edit with your actual values
   # Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Run Deployment Test**
   ```bash
   # PowerShell (Windows)
   .\test-deployment.ps1
   
   # Bash (Linux/Mac)
   ./test-deployment.sh
   ```

## 📁 Files Created

### Docker Configuration
- `Dockerfile.nextjs` - Next.js production build optimized for Railway
- `Python/voice_service/Dockerfile` - Python voice service with all dependencies
- `docker-compose.yml` - Multi-service orchestration matching Railway setup

### Testing Scripts
- `test-deployment.ps1` - PowerShell script for Windows
- `test-deployment.sh` - Bash script for Unix systems

### Environment
- `.env.local.example` - Template with all required environment variables

## 🔍 What Gets Tested

### 1. **Build Process**
- ✅ Next.js TypeScript compilation
- ✅ Next.js production build
- ✅ Python service dependency installation
- ✅ Docker image builds for both services

### 2. **Health Checks**
- ✅ Next.js API health endpoint (`/api/health`)
- ✅ Python service health endpoint (`/health`)
- ✅ Service communication between frontend and backend

### 3. **Environment Matching**
- ✅ Same Node.js version as Railway
- ✅ Same Python dependencies
- ✅ Same environment variables
- ✅ Same build commands
- ✅ Same startup commands

## 📋 Expected Output

```
🚀 Starting Local Railway Deployment Test
==========================================
✅ Docker is running
✅ Next.js build successful  
✅ Python service dependencies installed
✅ Next.js Docker image built successfully
✅ Python Voice Service Docker image built successfully
✅ Next.js service is healthy
✅ Python Voice Service is healthy

🎉 All services are running successfully!
==========================================

📋 Service URLs:
   • Next.js Frontend: http://localhost:3000
   • Python Voice Service: http://localhost:8000
   • Voice Service Health: http://localhost:8000/health
```

## 🛠️ Manual Testing Commands

If you prefer to test step-by-step:

```bash
# 1. Test Next.js build
npm run build

# 2. Test Python service locally
cd Python/voice_service
uv pip install -e .
uv run uvicorn app.main:app --reload
cd ../..

# 3. Test Docker builds
docker build -f Dockerfile.nextjs -t hana-voice-saas:test .
docker build -f Python/voice_service/Dockerfile -t hana-voice-service:test .

# 4. Test complete stack
docker-compose up -d --build

# 5. Check health
curl http://localhost:3000/api/health
curl http://localhost:8000/health
```

## 🔧 Troubleshooting

### Docker Issues
```bash
# Clean up Docker
docker-compose down --remove-orphans
docker system prune -f

# Rebuild from scratch
docker-compose up -d --build --force-recreate
```

### Environment Issues
```bash
# Check environment variables are loaded
docker-compose config

# View service logs
docker-compose logs hana-voice-saas
docker-compose logs hana-voice-service
```

### Build Issues
```bash
# Clear Next.js build cache
rm -rf .next
npm run build

# Clear Python dependencies
cd Python/voice_service
rm -rf .venv __pycache__
uv pip install --force-reinstall -e .
cd ../..
```

## 🚦 Success Criteria

Your local test is successful when:

1. ✅ All Docker images build without errors
2. ✅ Both services start and respond to health checks
3. ✅ Frontend can communicate with voice service
4. ✅ Application loads in browser at http://localhost:3000

## 📤 Railway Deployment

Once local testing passes, your Railway deployment should work because:

- ✅ Same build process
- ✅ Same environment variables
- ✅ Same health check endpoints
- ✅ Same service architecture
- ✅ Same Docker base images

## 🔗 Next Steps

After successful local testing:

1. **Push to Git** - Railway deploys from your Git repository
2. **Configure Railway** - Set environment variables in Railway dashboard
3. **Monitor Deployment** - Use Railway's logs and metrics
4. **Scale as Needed** - Railway handles scaling automatically

## 📞 Support

If local testing fails but Railway succeeds:
- Check for platform-specific issues (Windows vs Linux)
- Verify all environment variables are set in Railway
- Review Railway's build logs for differences

If Railway fails but local testing succeeds:
- Check Railway's resource limits
- Verify all secrets are configured
- Review Railway deployment logs for specific errors
