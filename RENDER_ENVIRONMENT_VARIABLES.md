# Render Environment Variables Setup Guide

## Required Variables for Each Service

### 🌐 **API Service (hana-voice-api)**
**Required Variables:**
```
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key-here
```

**Optional Variables (FreePBX):**
```
FREEPBX_HOST=your-freepbx-server-host
FREEPBX_USERNAME=your-ami-username
FREEPBX_PASSWORD=your-ami-password
```

### 🔊 **Voice Service (hana-voice-service)**
**Required Variables:**
```
OPENAI_API_KEY=your-openai-api-key-here
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-anon-key
```

### 📊 **Data Service (hana-data-service)**
**Required Variables:**
```
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-anon-key
```

### 🖥️ **Frontend Service (hana-voice-frontend)**
**Required Variables:**
```
NEXT_PUBLIC_API_URL=https://hana-voice-api.onrender.com
NODE_ENV=production
```

## 🔧 **Global Variables (Set for All Services)**
```
ENVIRONMENT=production
LOG_LEVEL=INFO
DEFAULT_LANGUAGE=ar
DEFAULT_VOICE=nova
DEFAULT_SPEED=0.95
TIMEZONE=Asia/Riyadh
```

## 🚀 **Quick Setup Instructions**

### 1. **Create Supabase Account**
- Go to [supabase.com](https://supabase.com)
- Create new project
- Get `SUPABASE_URL` and `SUPABASE_KEY` from Project Settings → API

### 2. **Get OpenAI API Key**
- Go to [platform.openai.com](https://platform.openai.com)
- Create API key in API Keys section

### 3. **Generate JWT Secret**
- Use a long random string (min 32 characters)
- Example: `openssl rand -hex 32`

### 4. **Set Variables in Render Dashboard**
1. Go to Render dashboard → Your service → Environment
2. Add each variable from the lists above
3. Save and redeploy

## 🔒 **Security Notes**
- **Never commit real API keys** to GitHub
- **Use Render environment variables** for production secrets
- **Rotate keys regularly** for security
- **Test with development keys** first

## 📞 **Support**
If you need help obtaining any of these credentials, let me know which ones you're missing and I can guide you through the setup process.
