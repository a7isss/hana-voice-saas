# 🚀 Hana Voice SaaS - Railway Deployment Guide

Complete guide for deploying Hana Voice SaaS to Railway with Supabase database.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (Supabase)](#database-setup-supabase)
3. [Railway Deployment](#railway-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Initialization](#database-initialization)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- ✅ GitHub account with repository access
- ✅ Railway account ([railway.app](https://railway.app))
- ✅ Supabase account ([supabase.com](https://supabase.com))
- ✅ Maqsam account (for telephony) - Optional for initial deployment

### Local Tools
- ✅ Git installed
- ✅ Node.js 18+ installed
- ✅ Railway CLI (optional): `npm install -g @railway/cli`

---

## Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details:
   - **Name**: `hana-voice-saas`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `ap-southeast-1` for Middle East)
4. Click "Create new project"
5. Wait for project to be ready (~2 minutes)

### Step 2: Get Database Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...` (keep this secret!)

3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI format):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Step 3: Initialize Database Schema

**Option A: Using Supabase SQL Editor (Recommended)**

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the contents of `db/init-safe.sql` from your repository
4. Paste into the SQL editor
5. Click "Run" or press `Ctrl+Enter`
6. Verify success message: "✅ Database initialization completed successfully!"

**Option B: Using psql Command Line**

```bash
# Replace with your actual connection string
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres" < db/init-safe.sql
```

### Step 4: Verify Database Setup

1. In Supabase, go to **Table Editor**
2. Verify these tables exist:
   - ✅ users
   - ✅ hospitals
   - ✅ patients
   - ✅ campaigns
   - ✅ call_sessions
   - ✅ survey_responses
   - ✅ schema_migrations (should have 1 row)

---

## Railway Deployment

### Step 1: Connect GitHub Repository

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `hana-voice-saas`
5. Railway will detect `railway.toml` automatically

### Step 2: Configure Services

Railway will create two services based on `railway.toml`:
- **hana-voice-saas** (Next.js frontend)
- **hana-voice-service** (Python voice processing)

### Step 3: Set Up Persistent Storage (Voice Models)

For the Python voice service:

1. Click on **hana-voice-service** in Railway dashboard
2. Go to **Variables** tab
3. Click **New Variable** → **Add Volume**
4. Configure volume:
   - **Name**: `voice-models`
   - **Mount Path**: `/data/models`
   - **Size**: 2GB (minimum for voice models)
5. Click "Add"

### Step 4: Get Railway URLs

After deployment, Railway will provide URLs:
- Next.js: `https://hana-voice-saas.up.railway.app`
- Python: `https://hana-voice-service.up.railway.app`

Copy these URLs - you'll need them for environment variables.

---

## Environment Variables

### Generate Secure Secrets

Run these commands locally to generate secure random strings:

```bash
# JWT Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Admin Password (16 bytes)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Voice Service Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Voice Service Token (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Configure Next.js Service (hana-voice-saas)

In Railway dashboard, go to **hana-voice-saas** → **Variables**:

```env
# Database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_from_supabase
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://hana-voice-saas.up.railway.app
VOICE_SERVICE_URL=https://hana-voice-service.up.railway.app

# Authentication
JWT_SECRET_KEY=<generated_secret_from_above>
ADMIN_USERNAME=hana_admin_2024
ADMIN_PASSWORD=<generated_password_from_above>

# Voice Service Communication
VOICE_SERVICE_SECRET=<generated_secret_from_above>
```

### Configure Python Service (hana-voice-service)

In Railway dashboard, go to **hana-voice-service** → **Variables**:

```env
# Voice Service
VOICE_SERVICE_SECRET=<same_as_nextjs_service>
VOICE_SERVICE_TOKEN=<generated_token_from_above>

# Voice Models
VOSK_MODEL_PATH=/data/models/vosk-model-ar-0.22-linto-1.1.0
TTS_MODEL_PATH=/data/models/tts

# Configuration
LOG_LEVEL=INFO
MAX_CONCURRENT_SESSIONS=10
RATE_LIMIT_PER_MINUTE=60
```

### Optional: Telephony Integration

If you have Maqsam credentials, add to **hana-voice-saas**:

```env
TELEPHONY_TOKEN=your_maqsam_pre_shared_token
```

For advanced Maqsam configuration, these are available in the database settings UI.
```

---

## Database Initialization

### Verify Migration Status

1. Connect to your Supabase database
2. Run this query in SQL Editor:

```sql
SELECT * FROM schema_migrations ORDER BY version DESC;
```

Expected result:
```
version | name           | applied_at           | checksum
--------|----------------|---------------------|------------------
1       | initial_schema | 2025-11-17 08:00:00 | <hash>
```

### Check Sample Data

```sql
-- Verify super admin exists
SELECT email, full_name, role FROM users WHERE role = 'super_admin';

-- Verify sample hospital exists
SELECT name, name_ar, contract_status FROM hospitals LIMIT 1;
```

### Troubleshooting Database Issues

If initialization failed:

```sql
-- Check if migration ran
SELECT * FROM schema_migrations;

-- If empty, the script didn't complete
-- Re-run db/init-safe.sql

-- If migration exists but tables are missing, check for errors:
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

---

## Post-Deployment Verification

### 1. Health Checks

Test both services are running:

```bash
# Next.js health check
curl https://hana-voice-saas.up.railway.app/api/health

# Python health check
curl https://hana-voice-service.up.railway.app/health
```

Expected responses:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-17T08:00:00.000Z"
}
```

### 2. Database Connection

Test database connectivity:

```bash
curl https://hana-voice-saas.up.railway.app/api/health/db
```

Expected:
```json
{
  "database": "connected",
  "tables": 25
}
```

### 3. Voice Service Communication

Test Next.js → Python communication:

```bash
curl https://hana-voice-saas.up.railway.app/api/voice/test
```

### 4. Admin Login

1. Go to `https://hana-voice-saas.up.railway.app`
2. Navigate to admin login
3. Use credentials:
   - Username: `hana_admin_2024`
   - Password: `<your_generated_password>`

### 5. Hospital Signup Flow

1. Go to landing page
2. Click "إنشاء حساب مؤسسة" (Create Hospital Account)
3. Fill in hospital details
4. Verify signup request is created
5. Login as super admin to approve

---

## Troubleshooting

### Build Failures

**Next.js build fails:**
```bash
# Check build logs in Railway dashboard
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Missing dependencies

# Fix: Ensure all required env vars are set
# Fix: Run `npm run build` locally first
```

**Python build fails:**
```bash
# Check if poetry/uv is installing correctly
# Common issues:
# - pyproject.toml syntax errors
# - Missing dependencies

# Fix: Test locally with `uv sync`
```

### Runtime Errors

**Database connection fails:**
```bash
# Verify DATABASE_URL is correct
# Check Supabase project is active
# Verify IP allowlist in Supabase (should allow all for Railway)
```

**Voice service unreachable:**
```bash
# Check VOICE_SERVICE_URL is correct
# Verify VOICE_SERVICE_SECRET matches in both services
# Check Python service logs in Railway
```

**Voice models not loading:**
```bash
# Verify volume is mounted to /data/models
# Check volume has enough space (2GB minimum)
# Upload models to volume via Railway CLI or dashboard
```

### Database Issues

**Tables not created:**
```sql
-- Check if migration ran
SELECT * FROM schema_migrations;

-- If empty, re-run init-safe.sql
-- If exists, check for constraint errors
```

**Foreign key violations:**
```sql
-- This shouldn't happen with init-safe.sql
-- But if it does, check constraint order
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint 
WHERE contype = 'f';
```

### Performance Issues

**Slow database queries:**
```sql
-- Check if indexes are created
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Should see indexes on:
-- - users(email, hospital_id, role)
-- - patients(hospital_id, phone_number)
-- - call_sessions(campaign_id, patient_id, status)
```

**High memory usage:**
```bash
# Check Railway metrics
# Increase memory allocation if needed
# Optimize voice model loading
```

---

## Rollback Procedures

### Rollback Deployment

In Railway dashboard:
1. Go to service → **Deployments**
2. Find previous working deployment
3. Click "Redeploy"

### Rollback Database Changes

```sql
-- If you need to rollback database changes
-- (This is why we use transactions!)

-- Check current migration
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 1;

-- To rollback (create a new migration that undoes changes)
-- Never delete from schema_migrations directly
```

---

## Monitoring & Maintenance

### Regular Checks

**Daily:**
- ✅ Check Railway service status
- ✅ Monitor error logs
- ✅ Verify health endpoints

**Weekly:**
- ✅ Review database performance
- ✅ Check disk usage (voice models volume)
- ✅ Review API usage metrics

**Monthly:**
- ✅ Rotate secrets and passwords
- ✅ Update dependencies
- ✅ Review and optimize database queries
- ✅ Backup database (Supabase handles this automatically)

### Logs Access

**Railway Logs:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs --service hana-voice-saas
railway logs --service hana-voice-service
```

**Supabase Logs:**
- Go to Supabase dashboard → **Logs**
- Filter by severity, time range, etc.

---

## Security Best Practices

1. ✅ **Never commit secrets** to git
2. ✅ **Rotate credentials** regularly (every 90 days)
3. ✅ **Use strong passwords** (generated, not manual)
4. ✅ **Enable 2FA** on Railway and Supabase accounts
5. ✅ **Monitor access logs** for suspicious activity
6. ✅ **Keep dependencies updated** for security patches
7. ✅ **Use environment-specific secrets** (staging vs production)

---

## Support & Resources

### Documentation
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- Project Memory Bank: `memory-bank/`

### Getting Help
- Railway Discord: https://discord.gg/railway
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: Your repository issues

---

## Deployment Checklist

Use this checklist for each deployment:

### Pre-Deployment
- [ ] Database schema tested locally
- [ ] All environment variables documented
- [ ] Secrets generated and stored securely
- [ ] Voice models ready for upload
- [ ] Health check endpoints working locally

### Deployment
- [ ] Supabase project created
- [ ] Database initialized with `init-safe.sql`
- [ ] Railway project created
- [ ] GitHub repository connected
- [ ] Environment variables configured
- [ ] Persistent volume created and mounted
- [ ] Both services deployed successfully

### Post-Deployment
- [ ] Health checks passing
- [ ] Database connection verified
- [ ] Voice service communication working
- [ ] Admin login successful
- [ ] Hospital signup flow tested
- [ ] Logs reviewed for errors
- [ ] Performance metrics acceptable

### Documentation
- [ ] Deployment notes recorded
- [ ] Credentials stored in password manager
- [ ] Team notified of deployment
- [ ] Monitoring alerts configured

---

**🎉 Congratulations!** Your Hana Voice SaaS is now deployed and ready for production use!

For questions or issues, refer to the troubleshooting section or contact the development team.
