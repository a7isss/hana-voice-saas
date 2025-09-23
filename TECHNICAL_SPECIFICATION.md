# Hana Voice SaaS - Complete Technical Specification

## 🎯 **PROJECT OVERVIEW**

Hana Voice SaaS is a **production-ready Arabic voice survey platform** specifically designed for Saudi Arabian healthcare institutions. It conducts automated phone surveys in flawless Saudi Arabic, using advanced AI to understand spoken responses and generate actionable insights.

**Core Mission:** Democratize Arabic voice data collection for healthcare research and quality improvement initiatives in the Kingdom of Saudi Arabia.

**Current Status:** Production Ready (85%)
**Architecture:** Microservices with Supabase integration
**Deployment:** Render cloud platform with multi-service setup

---

## 🏗️ **ARCHITECTURE OVERVIEW**

### **Microservices Architecture**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   Voice Service │
│  (Next.js 15)   │◄──►│   (FastAPI)      │◄──►│   (TTS/STT)     │
│   Port: 3000    │    │   Port: 8000     │    │   Port: 8001    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              │
                      ┌─────────────────┐
                      │   Data Service  │
                      │   (Excel Export)│
                      │   Port: 8002    │
                      └─────────────────┘
```

### **Database Schema (Supabase)**
- **profiles**: User accounts and credits
- **institutions**: Healthcare clients
- **customers**: Patients for calling
- **survey_responses**: Voice survey results
- **call_logs**: Call analytics
- **credit_transactions**: Billing history
- **audio_files**: Cached TTS audio

### **Technology Stack**
- **Backend**: FastAPI (Python 3.11)
- **Frontend**: Next.js 15 (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **AI Services**: OpenAI TTS/STT
- **Telephony**: FreePBX AMI integration
- **Deployment**: Render multi-service
- **Authentication**: Supabase Auth

---

## 📋 **BUSINESS WORKFLOW**

### **Super Admin Operations**
1. **Institution Onboarding**: Create hospital accounts with unique client IDs
2. **Content Management**: Configure questionnaires and generate Arabic audio files
3. **Operations Control**: Upload patient data and monitor calling campaigns
4. **Revenue Management**: Manage credit system and billing

### **Call Processing Flow**
```
Excel Upload → Database → Call Coordinator → OpenAI TTS → Telephony → STT → Classification → Export
```

### **Credit System**
- **Free credits**: 10 calls per new institution
- **Paid credits**: $0.50 per successful call
- **Bulk discounts**: Volume-based pricing
- **Cost optimization**: Audio caching and efficient processing

---

## 🔧 **SYSTEM COMPONENTS**

### **API Service (`api-service/`)**
- **Main gateway** for all client interactions
- **Authentication** and authorization management
- **Institution management** and credit tracking
- **Call coordination** and telephony integration
- **Data export** and reporting endpoints

**Key Endpoints:**
- `POST /auth/login` - Admin authentication
- `POST /admin/setup-user` - Create hospital account
- `POST /api/upload-customers` - Excel patient data upload
- `POST /api/start-calling` - Initiate calling campaign
- `GET /export/surveys` - Excel data export

### **Voice Service (`voice-service/`)**
- **Arabic TTS/STT** processing with OpenAI
- **Saudi dialect optimization** for voice recognition
- **Audio file management** and caching
- **Speech classification** (yes/no/unsure)

**Key Features:**
- Saudi Arabic voice synthesis with 6 different voices
- Arabic speech recognition with confidence scoring
- Audio file caching to reduce API costs
- Multi-language support (Arabic, English, French, Spanish)

### **Data Service (`data-service/`)**
- **Excel export** with Arabic RTL formatting
- **Data processing** and transformation
- **Report generation** with bilingual content
- **Batch processing** for large datasets

**Export Capabilities:**
- Bilingual Excel reports (Arabic transcriptions + English classifications)
- Department-specific data segmentation
- Patient metadata and response analytics
- Confidence scoring and quality metrics

### **Frontend (`frontend/`)**
- **Next.js 15** dashboard with TypeScript
- **Arabic RTL support** and bilingual interface
- **Real-time analytics** and call monitoring
- **Responsive design** for mobile and desktop

**Dashboard Features:**
- Institution management and credit tracking
- Patient data upload and validation
- Calling campaign initiation and monitoring
- Real-time call status and analytics
- Data export and reporting interface

---

## 🔒 **SECURITY & COMPLIANCE**

### **Authentication & Authorization**
- **JWT tokens** for secure API access
- **Role-based access control** (user, admin, super_admin)
- **Supabase Row Level Security** for data protection
- **Rate limiting** and brute force protection

### **Data Protection**
- **Encrypted storage** for sensitive data
- **KSA privacy laws** compliance
- **GDPR compliance** for international standards
- **Audit trails** for all operations

### **Environment Security**
- **Secret management** via Render environment variables
- **HTTPS enforcement** for all communications
- **CORS configuration** for frontend security
- **Regular security updates** and monitoring

---

## 📊 **PERFORMANCE & SCALABILITY**

### **Performance Targets**
- **API response time**: <200ms for all endpoints
- **Voice processing**: <2 seconds for TTS/STT
- **Excel export**: <30 seconds for 10,000 records
- **Concurrent users**: 50+ simultaneous users

### **Scalability Features**
- **Horizontal scaling** with multiple service instances
- **Database connection pooling** for high concurrency
- **Audio file caching** to reduce API costs
- **Load balancing** across Render services

### **Monitoring & Observability**
- **Health checks** for all services
- **Structured logging** with correlation IDs
- **Performance metrics** collection
- **Alerting system** for critical failures

---

## 🚀 **DEPLOYMENT ARCHITECTURE**

### **Render Cloud Configuration**
```yaml
services:
  - type: web
    name: hana-voice-api
    env: python
    plan: standard
    buildCommand: cd api-service && pip install -r requirements.txt
    startCommand: cd api-service && uvicorn src.main:app --host 0.0.0.0 --port $PORT

  - type: web
    name: hana-voice-service
    env: python
    plan: standard
    buildCommand: cd voice-service && pip install -r requirements.txt
    startCommand: cd voice-service && uvicorn src.main:app --host 0.0.0.0 --port $PORT

  - type: web
    name: hana-data-service
    env: python
    plan: standard
    buildCommand: cd data-service && pip install -r requirements.txt
    startCommand: cd data-service && uvicorn src.main:app --host 0.0.0.0 --port $PORT

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

### **Required Environment Variables**
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

---

## 🎯 **HEALTHCARE FOCUS**

### **Medical Department Support**
- Cardiology, Dermatology, Emergency, Endocrinology
- ENT, General Practitioner, Laboratory, Neurology
- Obstetrics/Gynecology, Oncology, Ophthalmology
- Orthopedics, Pediatrics, Pharmacy, Physical Therapy
- Psychiatry, Radiology, Surgery, Urology

### **Patient Management**
- **Priority-based calling** for urgent cases
- **Follow-up scheduling** for incomplete surveys
- **Department-specific questionnaires** for relevant data collection
- **Arabic language optimization** for Saudi patients

### **Compliance Features**
- **Saudi healthcare regulations** compliance
- **Data anonymization** for patient privacy
- **Audit trails** for regulatory requirements
- **Export formatting** for healthcare reporting standards

---

## 🔧 **TECHNICAL IMPLEMENTATION**

### **Database Integration**
- **Supabase client-server architecture** for scalability
- **Real-time updates** for live call monitoring
- **Multi-tenant data isolation** for hospital security
- **Backup and recovery** procedures

### **Telephony Integration**
- **FreePBX AMI integration** for call control
- **Saudi phone number formatting** and validation
- **Call retry logic** for failed attempts
- **Arabic audio playback** optimization

### **AI Integration**
- **OpenAI TTS** for Saudi Arabic voice synthesis
- **OpenAI Whisper** for Arabic speech recognition
- **Confidence scoring** for response quality
- **Multi-language support** for international expansion

---

## 📈 **SUCCESS METRICS**

### **Technical Success Criteria**
- **Availability**: 99.5% uptime target
- **Performance**: <3 second call setup time
- **Quality**: >90% Arabic speech recognition accuracy
- **Scalability**: Support 50+ hospitals, 1000+ daily calls

### **Business Success Criteria**
- **Customer Acquisition**: 5 hospitals in first month
- **Conversion Rate**: 80% call completion rate
- **Revenue Target**: $500/month average per hospital
- **Customer Satisfaction**: Positive Arabic voice quality feedback

---

## 🔮 **FUTURE EXPANSIONS**

### **Phase 2 Features**
- **Hospital self-service dashboard** for direct access
- **Advanced analytics** with sentiment analysis
- **Multi-dialect support** for Khaliji variants
- **SMS notifications** for appointment reminders

### **Technical Expansions**
- **Custom Arabic ML models** for improved accuracy
- **Twilio integration** for international expansion
- **Real-time WebSocket monitoring** for live call tracking
- **Mobile app** for hospital administrators

---

## 📞 **SUPPORT & MAINTENANCE**

### **Daily Operations**
- **System health monitoring** and alerting
- **Credit management** and billing operations
- **Customer support** for hospital administrators
- **Performance optimization** and tuning

### **Monthly Maintenance**
- **Security updates** and dependency management
- **Database backups** and archival procedures
- **Feature updates** and bug fixes
- **Performance reviews** and optimization

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues & Solutions**
- **Database connection**: Verify SUPABASE_URL and SUPABASE_KEY
- **Voice processing**: Check OPENAI_API_KEY and API quota
- **Telephony issues**: Verify FreePBX configuration and connectivity
- **Deployment failures**: Check Render logs and environment variables

### **Health Check Endpoints**
- API Service: `/health`
- Voice Service: `/health` 
- Data Service: `/health`
- Frontend: Built-in Next.js health checks

---

**Status**: Production Ready - Ready for Saudi Healthcare Voice Data Collection 🇸🇦❤️

This specification provides the complete technical foundation for Hana Voice SaaS, covering architecture, implementation, deployment, and operational procedures for successful Arabic healthcare voice survey operations.
