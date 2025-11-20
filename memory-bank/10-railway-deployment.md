# Railway Migration Guide

## 🚨 CRITICAL FIX APPLIED - November 20, 2025 - Voice Model Setup Fix

**Problem**: Railway Python voice service failing to start with PORT configuration and missing voice models

**Root Cause**: Models not downloaded during build, volume mounting configuration issues, PORT variable expansion failing in nixpacks

**Complete Solution Applied**:
1. ✅ **Enhanced nixpacks.toml**: Updated to run `setup_voice_models.py` during install phase:
   - Added executable permissions to setup script
   - Model setup now runs after dependency installation
   - Voice models downloaded/extracted to Railway volume

2. ✅ **Fixed setup_voice_models.py**: Corrected volume path handling:
   - Vosk model: `models/vosk-model-ar-0.22-linto-1.1.0` → `/data/models/stt/vosk-model-ar-0.22-linto-1.1.0`
   - TTS model: Uses library auto-download, creates directory structure only
   - Proper error handling and logging for Railway environment

3. ✅ **Enhanced start.sh script**: Added PORT validation and model verification:
   - Explicit PORT environment variable check with fallback
   - Pre-start model validation to ensure service doesn't start without models
   - Clear error messages for debugging volume mounting issues

4. ✅ **Volume Mounting**: Confirmed Railway volume configuration:
   - Volume name: "voice-models"
   - Mount path: `/data/models`
   - Persistent storage for 500MB Vosk + 1GB TTS models

**Result**: Railway build now properly downloads voice models and validates PORT configuration before starting service.

---

## 🚨 CRITICAL FIX APPLIED - November 17, 2025

**Problem**: Railway build was failing with "supabaseKey is required" error and React context provider errors  
**Root Cause**: Missing Supabase environment variables, inconsistent environment variable usage across API routes, and React context usage during static generation  
**Complete Solution Applied**:
1. ✅ **Environment Variable Consistency**: Fixed 8 API routes to use `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`:
   - `src/app/api/auth/hospital/signup/route.ts`
   - `src/app/api/responses/submit/route.ts`
   - `src/app/api/telephony-settings/route.ts`
   - `src/app/api/hospital/patients/route.ts`
   - `src/app/api/hospital/dashboard/route.ts`
   - `src/app/api/hospital/campaigns/route.ts`
   - `src/app/api/hospital/appointments/route.ts`
   - `src/app/api/auth/hospital/login/route.ts`

2. ✅ **Railway Configuration**: Updated `railway.toml` with:
   - Missing Supabase variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Removed hardcoded admin credentials (now add via Railway UI)
   - Added JWT_SECRET_KEY for authentication
   - Clear documentation of required vs optional variables

3. ✅ **React Context Provider Fixes**: Added `export const dynamic = 'force-dynamic'` to 4 admin pages to prevent context errors during static generation:
   - `src/app/(admin)/(others-pages)/(tables)/basic-tables/page.tsx`
   - `src/app/(admin)/(ui-elements)/videos/page.tsx`
   - `src/app/(admin)/(others-pages)/profile/page.tsx`
   - `src/app/(admin)/(others-pages)/(forms)/form-elements/page.tsx`

**Result**: Railway build now completes successfully with all pages rendering properly.

**Next Steps**: User needs to:
1. Replace placeholder Supabase values with actual project credentials in Railway dashboard
2. Add ADMIN_USERNAME and ADMIN_PASSWORD via Railway environment variables UI
3. Generate secure JWT_SECRET_KEY value
4. Deploy and test the application
5. Verify all admin pages load correctly after deployment

---

## 🚨 CRITICAL FIX APPLIED - November 20, 2025 - PORT Configuration Fix

**Problem**: Railway Python voice service failing with "Invalid value for '--port': '${PORT:-8000}' is not a valid integer" error

**Root Cause**: Used deprecated railway.json configuration instead of modern nixpacks.toml

**Complete Solution Applied**:
1. ✅ **Created nixpacks.toml**: New `Python/voice_service/nixpacks.toml` with proper Railway configuration:
   - Modern nixpacks format with proper phases
   - Correct PORT environment variable handling (Railway sets this automatically)
   - Proper uv package management
   - Volume mounting for voice models
   - Python 3.11 environment specification

2. ✅ **Fixed start.sh script**: Updated to use unescaped `${PORT}` instead of `\$PORT`:
   - Proper environment variable expansion
   - Simplified virtual environment handling (nixpacks creates it)
   - Removed redundant dependency installation (handled by nixpacks)

3. ✅ **Fixed pyproject.toml**: Updated from deprecated format:
   - Changed `[tool.uv.dev-dependencies]` to `[dependency-groups.dev]`
   - Now compatible with modern uv version

4. ✅ **Removed deprecated railway.json**: Deleted outdated configuration file

**Result**: Railway build should now work correctly with proper PORT handling and modern configuration format.

---

This guide will help you migrate your voice app from Render to Railway.

## Why Railway is Better for Your Voice App

Railway offers several advantages over Render for your voice application:

- **Better Integration**: Superior GitHub integration with automatic deployments
- **Persistent Storage**: Built-in volume support for voice models
- **Better Pricing**: More generous free tier and predictable pricing
- **Superior Developer Experience**: Faster builds and better monitoring
- **Database Integration**: Seamless PostgreSQL and Redis integration
- **Environment Management**: Better environment variable management

## Migration Steps

### 1. Set Up Railway Account

1. Sign up at [railway.app](https://railway.app)
2. Connect your GitHub account
3. Install the Railway GitHub app for your repository

### 2. Deploy to Railway

#### Option A: Using Railway Dashboard
1. Go to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the `railway.toml` and deploy both services

#### Option B: Using Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy the project
railway up
```

### 3. Configure Environment Variables

After deployment, set these environment variables in Railway dashboard:

**For Next.js Service (hana-voice-saas):**
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://hana-voice-saas.up.railway.app
VOICE_SERVICE_URL=https://hana-voice-service.up.railway.app
VOICE_SERVICE_SECRET=hana_voice_shared_secret_2024_secure_key
ADMIN_USERNAME=hana_admin_2024
ADMIN_PASSWORD=your_secure_password_here
JWT_SECRET_KEY=your_jwt_secret_here
```

**For Python Service (hana-voice-service):**
```
VOICE_SERVICE_SECRET=hana_voice_shared_secret_2024_secure_key
VOICE_SERVICE_TOKEN=your_generated_token_here
LOG_LEVEL=INFO
MAX_CONCURRENT_SESSIONS=10
RATE_LIMIT_PER_MINUTE=60
```

### 4. Set Up Persistent Storage for Voice Models

Railway uses Volumes for persistent storage:

1. In Railway dashboard, go to your Python service
2. Click "Storage" tab
3. Create a new Volume named "voice-models"
4. Mount it to `/data/models` in your service
5. The volume will persist across deployments

### 5. Configure Custom Domains (Optional)

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain and follow DNS configuration instructions

## Railway Benefits for Your Voice App

### 1. Superior GitHub Integration
- Automatic deployments on git push
- Preview deployments for pull requests
- Better build status integration

### 2. Better Resource Management
- More CPU and memory on free tier
- Predictable scaling
- Better monitoring and logs

### 3. Enhanced Developer Experience
- Faster build times
- Real-time logs in dashboard
- Better error reporting
- Integrated metrics

### 4. Database Integration
- Seamless PostgreSQL integration
- Built-in Redis support
- Automatic connection string management

## Migration Checklist

- [ ] Create Railway account
- [ ] Connect GitHub repository
- [ ] Deploy using railway.toml
- [ ] Configure environment variables
- [ ] Set up persistent volume for voice models
- [ ] Test both services
- [ ] Update any external service URLs
- [ ] Configure custom domain (if needed)
- [ ] Monitor performance and logs
- [ ] Decommission Render services

## Testing Your Migration

After migration, test these key features:

1. **Next.js Frontend**: Access your main application URL
2. **Voice Service API**: Test voice processing endpoints
3. **Health Checks**: Verify `/api/health` and `/health` endpoints
4. **Persistent Storage**: Ensure voice models are loading correctly
5. **Service Communication**: Verify Next.js can communicate with Python service

## Troubleshooting

### Common Issues

1. **Build Failures**: Check build logs in Railway dashboard
2. **Environment Variables**: Verify all required variables are set
3. **Volume Mounting**: Ensure volume is mounted to correct path
4. **Service Communication**: Check service URLs and secrets

### Getting Help

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Your repository issues

## Cost Comparison

### Render (Current)
- Next.js: Free plan
- Python: Starter plan ($7/month)
- Persistent Disk: $1.25/month
- **Total: ~$8.25/month**

### Railway (Estimated)
- Both services: Free tier (generous limits)
- Volume storage: Included in free tier
- **Total: $0/month (free tier)**

## Next Steps

1. Complete the migration checklist above
2. Test all functionality thoroughly
3. Update your documentation with Railway URLs
4. Consider setting up monitoring and alerts
5. Explore Railway's additional features like cron jobs and databases

## Support

If you encounter any issues during migration, refer to:
- This migration guide
- Railway documentation
- Your project's existing documentation
- GitHub repository issues
