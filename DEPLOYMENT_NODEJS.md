# 🚀 Next.js Frontend - Railway Deployment Guide

Complete guide for deploying the Next.js frontend and API routes to Railway with Supabase integration.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Service Architecture](#service-architecture)
3. [Railway Configuration](#railway-configuration)
4. [Environment Variables](#environment-variables)
5. [Supabase Database Setup](#supabase-database-setup)
6. [Deployment Process](#deployment-process)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- ✅ Railway account ([railway.app](https://railway.app))
- ✅ Supabase account ([supabase.com](https://supabase.com))
- ✅ GitHub account with repository access

### Local Tools
- ✅ Node.js 18+ installed
- ✅ npm or pnpm package manager
- ✅ Git installed

### System Requirements
- ✅ 1GB+ RAM for Next.js build process
- ✅ 500MB+ disk space for build artifacts
- ✅ Fast internet for Supabase API calls

---

## Service Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with RTL support
- **Database**: Supabase PostgreSQL
- **Authentication**: JWT tokens with refresh
- **API**: Next.js API Routes (Serverless)
- **Real-time**: WebSocket client for voice communication
- **Package Manager**: pnpm (preferred) or npm

### Application Structure
```
Next.js Application
├── Frontend Pages
│   ├── Landing page and marketing
│   ├── Hospital signup/login
│   ├── Admin dashboard
│   └── Patient interface
├── API Routes (Serverless)
│   ├── Authentication (/api/auth)
│   ├── Database operations (/api/hospital/*)
│   ├── Voice service integration (/api/voice)
│   ├── Telephony management (/api/telephony)
│   └── Data export (/api/data)
└── Real-time Features
    ├── WebSocket client
    └── Live updates
```

### Key Features
- **Multi-tenant**: Hospital isolation with Row Level Security
- **Healthcare Focus**: Arabic RTL interface with healthcare workflows
- **Real-time**: WebSocket connections to Python voice service
- **API Routes**: Serverless functions for backend operations
- **Type Safety**: Full TypeScript coverage
- **Responsive**: Mobile-first design with Arabic RTL support

---

## Railway Configuration

### Service Detection
Railway automatically detects the Next.js service from:
- **Source Path**: `.` (root directory)
- **Config Files**: `package.json`, `next.config.ts`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start -- -p $PORT`

### railway.toml Configuration
```toml
[[services]]
name = "hana-voice-saas"
sourcePath = "."
buildCommand = "npm install && npm run build"
startCommand = "npm start -- -p $PORT"
healthcheckPath = "/api/health"
healthcheckTimeout = 300

[services.env]
NODE_ENV = "production"

# Supabase Configuration (REQUIRED - Add your actual values)
NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-supabase-anon-key"

# Authentication & Security (REQUIRED - Generate secure values)
JWT_SECRET_KEY = "generate_jwt_secret_here"

# Voice Service Integration (OPTIONAL - Add your values if using voice features)
VOICE_SERVICE_URL = "https://hana-voice-service.up.railway.app"
VOICE_SERVICE_SECRET = "hana_voice_shared_secret_2024_secure_key"

# Admin Access (ADD VIA RAILWAY UI - Do not hardcode)
# ADMIN_USERNAME = "your_admin_username"
# ADMIN_PASSWORD = "your_secure_password"
```

### Package.json Configuration
```json
{
  "name": "hana-voice-saas",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p $PORT",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0"
    // ... other dependencies
  }
}
```

---

## Environment Variables

### Required Variables
```bash
# Next.js Configuration
NODE_ENV=production

# Supabase Database (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Authentication (REQUIRED)
JWT_SECRET_KEY=your_secure_jwt_secret_here

# Admin Access (REQUIRED)
ADMIN_USERNAME=hana_admin_2024
ADMIN_PASSWORD=your_secure_admin_password
```

### Optional Variables
```bash
# Voice Service Integration
VOICE_SERVICE_URL=https://hana-voice-service.up.railway.app
VOICE_SERVICE_SECRET=hana_voice_shared_secret_2024_secure_key

# Telephony Integration
MAQSAM_API_URL=https://api.maqsam.com
MAQSAM_API_TOKEN=your_maqsam_token
MAQSAM_PHONE_NUMBER=+966XXXXXXXXX

# Analytics & Monitoring
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
SENTRY_DSN=your_sentry_dsn
```

### Generating Secure Secrets
```bash
# Generate JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate admin password (16+ characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## Supabase Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details:
   - **Name**: `hana-voice-saas`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest region
4. Wait for project to initialize (~2 minutes)

### 2. Get Database Credentials
1. **Project URL**: Settings → API → Project URL
2. **Anon Key**: Settings → API → anon/public key
3. **Service Role Key**: Settings → API → service_role key (keep secret!)
4. **Connection String**: Settings → Database → Connection string (URI format)

### 3. Initialize Database Schema
1. **SQL Editor**: Go to SQL Editor in Supabase dashboard
2. **Upload Schema**: Copy contents of `db/init-safe.sql` from repository
3. **Run Migration**: Execute the SQL to create all tables
4. **Verify**: Check that all tables are created in Table Editor

### 4. Enable Row Level Security (RLS)
```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Create basic policies (customize based on your needs)
CREATE POLICY "Users can view their own data" ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Hospitals can view their own data" ON hospitals
    FOR ALL USING (auth.uid() = hospital_id);
```

### 5. Configure Authentication
1. **Authentication**: Go to Authentication → Settings
2. **Site URL**: Set to your Railway domain
3. **Email Templates**: Configure password reset emails
4. **JWT Secret**: Use the same JWT_SECRET_KEY as in Railway

---

## Deployment Process

### 1. Prepare Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Deploy Next.js frontend to Railway"
git push origin master
```

### 2. Railway Dashboard Deployment
1. **New Project**: Go to Railway dashboard → "New Project"
2. **Deploy from GitHub**: Select your repository
3. **Service Detection**: Railway auto-detects Next.js service
4. **Build Process**: npm install and next build

### 3. Environment Configuration
1. **Set Variables** in Railway dashboard for the Next.js service:
   - Add Supabase credentials
   - Add JWT secret
   - Add admin credentials
   - Add voice service URL (if using)

### 4. Database Connection Setup
1. **Verify Environment**: Check that Supabase variables are set
2. **Test Connection**: Use health endpoint to verify database connectivity
3. **RLS Testing**: Verify Row Level Security is working

### 5. Custom Domain (Optional)
1. **Domain Settings**: Go to service → Settings → Custom Domains
2. **DNS Configuration**: Add CNAME record to Railway-provided URL
3. **SSL Certificate**: Railway automatically provides SSL

---

## Testing & Verification

### Health Check Endpoints
```bash
# Basic health check
curl https://hana-voice-saas.railway.app/api/health

# Database connectivity
curl https://hana-voice-saas.railway.app/api/health/database

# Voice service connectivity
curl https://hana-voice-saas.railway.app/api/health/voice
```

Expected Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "voice_service": "connected",
  "timestamp": "2025-11-19T08:00:00.000Z"
}
```

### Frontend Testing
1. **Landing Page**: Navigate to the main URL
2. **Hospital Signup**: Test `/hospital/signup` flow
3. **Admin Login**: Test `/admin/login` with credentials
4. **Hospital Dashboard**: Verify `/hospital` loads correctly

### API Testing
```bash
# Test authentication endpoint
curl -X POST https://hana-voice-saas.railway.app/api/auth/hospital/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass"}'

# Test health check
curl https://hana-voice-saas.railway.app/api/health
```

### Database Integration Testing
```bash
# Test database query (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://hana-voice-saas.railway.app/api/hospital/dashboard
```

### WebSocket Connection Test
```javascript
// Test WebSocket connection to voice service
const VOICE_SERVICE_URL = 'https://hana-voice-service.up.railway.app';
const ws = new WebSocket(`${VOICE_SERVICE_URL}/ws/healthcare-questionnaire`);
ws.onopen = () => console.log('✅ Connected to voice service');
ws.onclose = () => console.log('❌ WebSocket disconnected');
```

---

## API Endpoints

### Authentication API (`/api/auth/*`)
```typescript
POST /api/auth/hospital/signup     # Hospital registration
POST /api/auth/hospital/login      # Hospital authentication
POST /api/auth/hospital/logout     # Hospital logout
GET  /api/auth/hospital/me         # Get current hospital data
```

### Hospital Management (`/api/hospital/*`)
```typescript
GET    /api/hospital/dashboard      # Dashboard data
GET    /api/hospital/patients       # Patient list
POST   /api/hospital/patients       # Create patient
GET    /api/hospital/campaigns      # Campaign list
POST   /api/hospital/campaigns      # Create campaign
GET    /api/hospital/appointments   # Appointment list
```

### Voice Service Integration (`/api/voice/*`)
```typescript
GET  /api/voice/test               # Test voice service connectivity
POST /api/voice/process            # Process voice request
GET  /api/voice/health             # Voice service health check
```

### Telephony Management (`/api/telephony/*`)
```typescript
GET  /api/telephony/settings       # Get telephony settings
POST /api/telephony/settings       # Update telephony settings
POST /api/telephony/test-connection # Test telephony connection
```

### Survey Management (`/api/surveys/*`)
```typescript
GET  /api/surveys                  # Get surveys list
POST /api/surveys                  # Create new survey
GET  /api/surveys/[id]            # Get specific survey
POST /api/surveys/[id]            # Update survey
```

### Health Monitoring (`/api/health/*`)
```typescript
GET  /api/health                   # Basic health check
GET  /api/health/database          # Database connectivity
GET  /api/health/voice             # Voice service connectivity
```

---

## Integration with Voice Service

### Environment Configuration
```bash
# In Railway dashboard for Next.js service
VOICE_SERVICE_URL=https://hana-voice-service.up.railway.app
VOICE_SERVICE_SECRET=hana_voice_shared_secret_2024_secure_key
```

### Client-Side Integration
```typescript
// lib/voiceService.ts
import { WebSocket } from 'ws';

class VoiceServiceClient {
  private ws: WebSocket | null = null;
  
  async connect(endpoint: string = '/ws/healthcare-questionnaire') {
    const baseUrl = process.env.NEXT_PUBLIC_VOICE_SERVICE_URL!;
    const secret = process.env.VOICE_SERVICE_SECRET!;
    
    this.ws = new WebSocket(`${baseUrl}${endpoint}`);
    
    return new Promise((resolve, reject) => {
      this.ws!.on('open', () => {
        // Authenticate
        this.ws!.send(JSON.stringify({
          type: 'auth',
          secret: secret
        }));
        resolve(true);
      });
      
      this.ws!.on('error', reject);
    });
  }
  
  async sendAudio(audioData: ArrayBuffer) {
    if (!this.ws) throw new Error('WebSocket not connected');
    
    this.ws.send(JSON.stringify({
      type: 'audio',
      data: Buffer.from(audioData).toString('base64')
    }));
  }
}
```

### API Route Integration
```typescript
// app/api/voice/process/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { audioData, sessionId } = await req.json();
    
    // Forward to Python voice service
    const response = await fetch(`${process.env.VOICE_SERVICE_URL}/ws/healthcare-questionnaire`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOICE_SERVICE_SECRET}`
      },
      body: JSON.stringify({ audioData, sessionId })
    });
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Voice processing failed' },
      { status: 500 }
    );
  }
}
```

---

## Troubleshooting

### Build Failures
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Check for missing dependencies
npm audit

# Verify Next.js build locally
npm run build
```

### Database Connection Issues
```bash
# Test Supabase connection
curl "https://YOUR_PROJECT.supabase.co/rest/v1/?apikey=YOUR_ANON_KEY"

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### API Route Errors
```bash
# Check API route health
curl https://hana-voice-saas.railway.app/api/health

# Test specific routes
curl -X GET https://hana-voice-saas.railway.app/api/auth/status

# Check logs in Railway dashboard for detailed error messages
```

### Common Issues and Solutions

#### "supabaseKey is required" Error
- **Cause**: Missing Supabase environment variables
- **Solution**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

#### Authentication Failures
- **Cause**: JWT secret mismatch or invalid token
- **Solution**: Verify `JWT_SECRET_KEY` is consistent across environment and Supabase

#### React Context Provider Errors
- **Cause**: Static generation trying to use context
- **Solution**: Add `export const dynamic = 'force-dynamic'` to affected pages

#### CORS Issues with Voice Service
- **Cause**: CORS configuration problems
- **Solution**: Verify `VOICE_SERVICE_URL` and secret are correctly configured

#### Database RLS Policy Violations
- **Cause**: Row Level Security preventing access
- **Solution**: Review and update RLS policies in Supabase dashboard

### Performance Issues
```bash
# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s https://hana-voice-saas.railway.app/api/health

# Check for memory leaks in build process
# Monitor Railway metrics for memory usage
```

---

## Monitoring & Maintenance

### Key Metrics to Monitor
- **Response Times**: API endpoints should respond < 500ms
- **Build Success**: All deployments should complete successfully
- **Database Connection**: Health check should show "connected"
- **Error Rates**: Monitor 4xx and 5xx HTTP status codes
- **User Activity**: Track hospital signups and logins

### Regular Maintenance
- **Weekly**: Check health endpoints and error logs
- **Monthly**: Review Supabase usage and upgrade if needed
- **Updates**: Test Next.js version updates in staging first
- **Security**: Rotate JWT secrets and admin passwords quarterly

### Backup & Recovery
- **Database**: Supabase provides automatic backups
- **Environment**: Document all environment variables
- **Code**: Git repository serves as code backup
- **Configuration**: railway.toml is version controlled

---

## Security Considerations

### Environment Security
- **Never commit secrets** to git
- **Use Railway environment variables** for all sensitive data
- **Rotate credentials** regularly
- **Enable 2FA** on Railway and Supabase accounts

### Database Security
- **Row Level Security**: Enable and configure RLS policies
- **API Keys**: Use anon key for frontend, service role for server-side only
- **SSL/TLS**: All connections over HTTPS
- **Access Logging**: Monitor Supabase logs for suspicious activity

### Authentication Security
- **JWT Tokens**: Use strong secrets, implement refresh tokens
- **Password Policy**: Enforce strong passwords for admin access
- **Session Management**: Implement proper session timeout
- **CSRF Protection**: Next.js provides built-in CSRF protection

---

## Support & Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Getting Help
- Railway Discord: https://discord.gg/railway
- Supabase Discord: https://discord.supabase.com
- Next.js Discord: https://discord.gg/nextjs
- GitHub Issues: Project repository issues

---

**Last Updated**: November 19, 2025  
**Next.js Version**: 15+  
**Database**: Supabase PostgreSQL  
**Deployment Platform**: Railway with auto-deployment
