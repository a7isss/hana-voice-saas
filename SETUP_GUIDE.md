# Hana Voice SaaS - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites Checklist
- [ ] Node.js 18.x or later installed
- [ ] npm or yarn package manager
- [ ] Supabase account and project
- [ ] Maqsam telephony account (optional for live calling)
- [ ] Python 3.11+ for local voice processing (optional for development)

### 5-Minute Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/a7isss/hana-voice-saas.git
   cd hana-voice-saas
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open http://localhost:3000
   - Login with default credentials (if applicable)

## 🔧 Detailed Setup Instructions

### Step 1: Environment Configuration

#### Required Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your actual values:

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

#### Getting Supabase Credentials
1. Go to [Supabase](https://supabase.com) and create a new project
2. Navigate to Settings → API
3. Copy the Project URL and anon public key
4. Import the database schema from `supabase_schema.sql`

#### Getting Maqsam Telephony Token (Optional)
1. Sign up with Maqsam telephony service
2. Obtain your API key or pre-shared token
3. Add the TELEPHONY_TOKEN to your environment variables

#### Alternative: Local Development
For local voice processing development:
1. Ensure Python 3.11+ is installed
2. Install voice service dependencies: `pip install -r Python/voice_service/requirements.txt`
3. Start voice service: `cd Python/voice_service && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Step 2: Database Setup

#### Import Database Schema
1. In your Supabase project, go to SQL Editor
2. Copy the contents of `supabase_schema.sql`
3. Execute the SQL to create tables and relationships

#### Verify Database Structure
After importing, you should have these tables:
- `clients` - Healthcare client organizations
- `customers` - Patient/customer records
- `call_logs` - Call history and analytics
- `survey_responses` - Patient survey responses

### Step 3: Development Server

#### Start Development Mode
```bash
npm run dev
```

#### Verify Setup
1. Open http://localhost:3000
2. Navigate to the dashboard
3. Test API endpoints:
   - http://localhost:3000/api/auth (should return healthy status)
   - http://localhost:3000/api/voice (should return healthy status)
   - http://localhost:3000/api/data (should return healthy status)

### Step 4: Testing Core Functionality

#### Test Voice Processing
1. Navigate to Audio Conversion page
2. Test text-to-speech with Arabic text
3. Verify audio generation works

#### Test Call Automation
1. Navigate to Calling Robot page
2. Upload a sample Excel file with patient data
3. Test single call functionality

#### Test Data Export
1. Navigate to appropriate data export sections
2. Generate sample Excel reports
3. Verify Arabic RTL formatting

## 🐳 Docker Setup (Alternative)

### Using Docker Compose
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

### Dockerfile
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

## 🔌 Integration Setup

### Maqsam Telephony Integration (Optional)
1. **Sign up for Maqsam service**
   - Visit Maqsam website to register for telephony services
   - Obtain your API key or pre-shared token
   - Add TELEPHONY_TOKEN to your environment variables

2. **Test Connection**
   ```bash
   # Test connectivity to Maqsam service
   # (Command depends on Maqsam's API - check their documentation)
   ```

### Voice Processing (Automatic)
The application automatically handles Arabic voice processing using:
- **Speech Recognition**: Vosk Arabic STT model (local processing)
- **Text-to-Speech**: Coqui XTTS Arabic model (local processing)
- **No external API costs**: All voice processing is local to the server

### Supabase Real-time Features
1. **Enable Realtime**
   - In Supabase dashboard, go to Database → Replication
   - Enable realtime for required tables
   - Configure row level security policies

### Local Development
For local voice processing development:
1. Install Python dependencies:
   ```bash
   cd Python/voice_service
   pip install -r requirements.txt
   ```
2. Start voice service: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
3. Test endpoints:
   - WebSocket: `ws://localhost:8000/ws/echo`
   - Health: `http://localhost:8000/health`

## 🧪 Testing Strategy

### Unit Tests
```bash
# Run tests
npm test

# Test coverage
npm run test:coverage
```

### Integration Tests
1. **API Endpoint Testing**
   ```bash
   # Test health endpoints
   curl http://localhost:3000/api/auth
   ```

2. **Database Testing**
   - Test CRUD operations
   - Verify foreign key relationships
   - Test concurrent access

### End-to-End Testing
1. **User Flow Testing**
   - Patient registration flow
   - Call initiation process
   - Data export functionality

## 🔒 Security Configuration

### Environment Security
- Never commit `.env.local` to version control
- Use different keys for development and production
- Rotate API keys regularly

### API Security
```typescript
// Example rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### Database Security
1. **Row Level Security (RLS)**
   - Enable RLS on all tables
   - Create policies for each user role
   - Test policy enforcement

2. **Connection Security**
   - Use SSL for database connections
   - Implement connection pooling
   - Monitor for suspicious activity

## 📊 Monitoring Setup

### Application Monitoring
1. **Health Checks**
   - Implement comprehensive health endpoints
   - Monitor external service connectivity
   - Set up alerting for failures

2. **Performance Monitoring**
   - Track API response times
   - Monitor database query performance
   - Set up error tracking

### Logging Configuration
```typescript
// Structured logging example
const logger = {
  info: (message: string, metadata?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...metadata
    }));
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: error?.message,
      stack: error?.stack
    }));
  }
};
```

## 🚀 Production Deployment

### Build Optimization
```bash
# Production build
npm run build

# Analyze bundle size
npm run analyze
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] CDN configured (if applicable)
- [ ] Monitoring and alerting setup
- [ ] Backup procedures established

### Performance Optimization
1. **Frontend Optimization**
   - Implement code splitting
   - Optimize images and assets
   - Enable gzip compression

2. **Backend Optimization**
   - Implement caching strategies
   - Optimize database queries
   - Use connection pooling

## 🔄 Maintenance Procedures

### Regular Maintenance
1. **Dependency Updates**
   ```bash
   # Check for updates
   npm outdated

   # Update dependencies
   npm update
   ```

2. **Database Maintenance**
   - Regular backups
   - Index optimization
   - Vacuum operations

3. **Security Updates**
   - Monitor security advisories
   - Apply patches promptly
   - Conduct security audits

### Disaster Recovery
1. **Backup Procedures**
   - Automated database backups
   - Configuration backup
   - Code repository backup

2. **Recovery Procedures**
   - Documented recovery steps
   - Test recovery procedures
   - Maintain recovery contacts

## 📞 Support Resources

### Getting Help
- **Documentation**: Refer to `PROJECT_DOCUMENTATION.md`
- **Issues**: Use GitHub Issues for bug reports
- **Community**: Stack Overflow for technical questions

### Common Issues
- **Build Failures**: Check Node.js version and dependencies
- **Database Issues**: Verify connection strings and permissions
- **API Issues**: Check environment variables and service status

### Emergency Contacts
- **Infrastructure**: Render support for deployment issues
- **Database**: Supabase support for database issues
- **Voice Processing**: Local models (no external API dependencies)
- **Maqsam Telephony**: Maqsam support for telephony issues

---

*This setup guide is part of the Hana Voice SaaS project documentation. For the most up-to-date information, always refer to the main documentation files.*
