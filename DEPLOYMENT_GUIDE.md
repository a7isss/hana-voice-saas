# Hana Voice SaaS - Deployment Guide

## 🚀 **One-Click Render Deployment**

### **Option 1: Direct Render Deploy (Recommended)**
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. **Click the "Deploy to Render" button above**
2. **Connect your GitHub repository**
3. **Render will automatically detect the `render.yaml` configuration**
4. **Set the following environment variables in Render dashboard:**

### **Required Environment Variables**

#### **API Service (`hana-voice-api`)**
```
JWT_SECRET_KEY=your-super-secret-jwt-key
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
FREEPBX_HOST=your-freepbx-server
FREEPBX_USERNAME=your-ami-username
FREEPBX_PASSWORD=your-ami-password
```

#### **Voice Service (`hana-voice-service`)**
```
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-anon-key
```

#### **Frontend (`hana-voice-frontend`)**
```
NEXT_PUBLIC_API_URL=https://hana-voice-api.onrender.com
NODE_ENV=production
```

### **Option 2: Manual Render Setup**

1. **Create a new Render account** at [render.com](https://render.com)
2. **Connect your GitHub repository**
3. **Render will automatically detect the multi-service setup**
4. **Each service will be deployed independently**

## 📋 **Pre-Deployment Checklist**

### **Before Deploying:**
- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Run the database schema: `supabase_schema.sql`
- [ ] Get OpenAI API key from [platform.openai.com](https://platform.openai.com)
- [ ] Configure FreePBX server (if using telephony)
- [ ] Set up custom domain (optional)

### **GitHub Repository Setup:**
- [ ] Push code to GitHub repository
- [ ] Ensure `render.yaml` is in the root directory
- [ ] Verify all services have proper `requirements.txt`/`package.json`

## 🔧 **Environment Configuration**

### **Local Development (.env file)**
```bash
# Copy from config/environment.example
cp config/environment.example .env

# Fill in your actual values
JWT_SECRET_KEY=your-secret-key
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key
FREEPBX_HOST=your-freepbx-host
```

### **Render Environment Variables**
- Set via Render dashboard for each service
- Use `sync: false` for sensitive keys (they won't be shared between services)
- Use `generateValue: true` for JWT_SECRET_KEY (Render will auto-generate)

## 🗃️ **Database Setup**

### **Supabase Configuration:**
1. **Create new project** at [supabase.com](https://supabase.com)
2. **Get connection details** from Project Settings → Database
3. **Run the schema:**
   ```sql
   -- Copy and paste the content of supabase_schema.sql
   -- into the Supabase SQL editor and run it
   ```

### **Database Tables Created:**
- `profiles` - User accounts and credits
- `institutions` - Healthcare clients
- `customers` - Patients for calling
- `survey_responses` - Voice survey results
- `call_logs` - Call analytics
- `credit_transactions` - Billing history
- `audio_files` - Cached TTS audio

## 🌐 **Custom Domain Setup (Optional)**

### **Steps for Custom Domain:**
1. **Purchase domain** from your preferred registrar
2. **In Render dashboard**, go to your service → Settings → Custom Domains
3. **Add your domain** (e.g., hana-voice.com)
4. **Update DNS records** as instructed by Render

### **Recommended DNS Configuration:**
```
A record: @ → 76.76.21.21
CNAME: www → your-app.onrender.com
```

## 📊 **Monitoring & Analytics**

### **Render Dashboard Features:**
- **Real-time logs** for each service
- **Performance metrics** (CPU, memory, response times)
- **Health checks** automatic monitoring
- **Auto-scaling** based on traffic

### **Custom Monitoring:**
- Health check endpoint: `/health`
- Service status endpoints for each microservice
- Database connection monitoring
- Error tracking and alerting

## 💰 **Cost Optimization**

### **Render Pricing Tiers:**
- **Free Tier**: Good for development and testing
- **Standard Tier**: Recommended for production ($25-50/month)
- **Pro Tier**: High traffic applications ($50-250/month)

### **Cost-Saving Tips:**
- Use Free tier for development
- Scale down during low-traffic hours
- Use Supabase free tier for small projects
- Monitor OpenAI API usage to control costs

## 🔒 **Security Configuration**

### **Essential Security Steps:**
1. **Generate strong JWT secret** (Render will auto-generate)
2. **Use HTTPS only** (enforced by Render)
3. **Set up CORS properly** for your frontend domain
4. **Implement rate limiting** in production
5. **Regularly rotate API keys**

### **Environment Security:**
```bash
# Production security settings
ENVIRONMENT=production
LOG_LEVEL=WARNING  # Reduce verbose logging in production
JWT_SECRET_KEY=very-long-random-string  # 64+ characters
```

## 🚨 **Troubleshooting**

### **Common Deployment Issues:**

#### **Build Failures:**
```bash
# Check build logs in Render dashboard
# Common issues: missing dependencies, syntax errors
```

#### **Database Connection Issues:**
```bash
# Verify SUPABASE_URL and SUPABASE_KEY
# Check Supabase project status
# Test connection from local environment first
```

#### **Service Communication Issues:**
```bash
# Verify service URLs in environment variables
# Check CORS settings
# Test health check endpoints
```

### **Health Check Endpoints:**
- API Service: `https://hana-voice-api.onrender.com/health`
- Voice Service: `https://hana-voice-service.onrender.com/health`
- Data Service: `https://hana-data-service.onrender.com/health`

## 🔄 **CI/CD Pipeline**

### **Automatic Deploys:**
- Push to `main` branch triggers automatic deployment
- Each service deploys independently
- Health checks ensure successful deployment
- Rollback on failure automatically

### **Manual Deploys:**
- Trigger via Render dashboard
- Deploy specific commits
- Preview deployments for testing

## 📞 **Support & Maintenance**

### **Daily Monitoring:**
- Check service health endpoints
- Monitor credit usage and billing
- Review error logs for issues
- Backup database regularly

### **Monthly Maintenance:**
- Update dependencies
- Review security settings
- Optimize performance
- Backup and archive old data

## 🎯 **Success Metrics**

### **Deployment Success Checklist:**
- [ ] All services deploy without errors
- [ ] Health checks pass (green status)
- [ ] Database connections work
- [ ] Frontend loads correctly
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] Voice processing functional

### **Performance Targets:**
- API response time < 200ms
- Service uptime > 99.5%
- Voice processing latency < 2 seconds
- Concurrent user support: 50+ users

---

**Need Help?** Check Render documentation or create an issue in the GitHub repository.

**Status**: Ready for production deployment 🚀
