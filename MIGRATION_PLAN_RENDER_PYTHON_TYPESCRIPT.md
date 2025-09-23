# ========================================================
# HANA VOICE SAAS - COMPLETE MIGRATION PLAN
# ========================================================

## 🎯 **INSTRUCTIONS FOR IMPLEMENTING AI**

**START FROM SCRATCH** - This plan provides a complete blueprint for rebuilding the Hana Voice SaaS system using a modern Python + TypeScript architecture on Render. The system should be built from the ground up following this specification.

**HIGH-LEVEL PURPOSE:** The system is a Saudi healthcare voice survey platform that makes automated phone calls to patients, conducts Arabic voice surveys using OpenAI TTS/STT, and exports results in Arabic-formatted Excel reports.

**OMIT USER SIGN-UP FLOW:** Users will be added manually via super admin dashboard only.

---

## 🏗️ **ARCHITECTURE OVERVIEW**

### **Target Stack:**
- **Backend:** Python FastAPI (3 microservices)
- **Frontend:** TypeScript Next.js (SSR)
- **Database:** Supabase (PostgreSQL + Auth)
- **Deployment:** Render (multi-service)
- **Voice Processing:** OpenAI TTS/STT with Saudi Arabic optimization

### **Core Components:**
1. **Voice Processing Service** - Arabic TTS/STT
2. **Data Processing Service** - Excel exports, reporting
3. **API Gateway Service** - Business logic, user management
4. **Next.js Frontend** - Dashboard, admin interface

---

## 📋 **PROJECT STRUCTURE (NEW)**

```
hana-voice-saas/
├── voice-service/           # Python FastAPI (port 8001)
│   ├── src/
│   │   ├── core/voice_utils.py
│   │   ├── core/stt_tts.py
│   │   └── api/routes.py
│   ├── requirements.txt
│   └── Dockerfile
├── data-service/            # Python FastAPI (port 8002)
│   ├── src/
│   │   ├── core/export_utils.py
│   │   └── api/routes.py
│   ├── requirements.txt
│   └── Dockerfile
├── api-service/             # Python FastAPI (port 8000)
│   ├── src/
│   │   ├── core/auth.py
│   │   ├── core/ai_agent.py
│   │   ├── storage/supabase_client.py
│   │   └── api/routes.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # TypeScript Next.js
│   ├── pages/
│   │   ├── api/            # Next.js API routes
│   │   ├── dashboard.tsx
│   │   ├── calls.tsx
│   │   └── admin.tsx
│   ├── components/
│   ├── styles/
│   └── package.json
├── config/
│   ├── telephony.json
│   └── surveys/            # Department questionnaires
├── docker-compose.yml       # Local development
├── render.yaml             # Production deployment
└── README.md
```

---

## 🔧 **SERVICE SPECIFICATIONS**

### **1. Voice Processing Service (`voice-service`)**

**Purpose:** Handle all audio generation and speech recognition

**Core Files to Reimplement:**
- `src/core/voice_utils.py` - OpenAI TTS with Saudi Arabic optimization
- `src/core/stt_tts.py` - Speech-to-text with Saudi dialect classification

**API Endpoints:**
```python
POST /voice/generate          # Generate Arabic TTS
POST /stt/process            # Process speech to text
GET  /voice/status           # Check audio file status
POST /voice/batch-generate   # Generate questionnaire audio
```

**Dependencies:** `openai`, `fastapi`, `pydantic`

**Environment Variables:**
```bash
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### **2. Data Processing Service (`data-service`)**

**Purpose:** Handle Excel exports, reporting, data analytics

**Core Files to Reimplement:**
- `src/core/export_utils.py` - Arabic Excel formatting, JSON exports

**API Endpoints:**
```python
POST /export/surveys         # Export survey responses
POST /export/customers       # Export customer lists
GET  /reports/stats          # Generate call statistics
POST /reports/comprehensive  # Comprehensive reports
```

**Dependencies:** `pandas`, `openpyxl`, `fastapi`

### **3. API Gateway Service (`api-service`)**

**Purpose:** Core business logic, user management, telephony integration

**Core Files to Reimplement:**
- `src/core/auth.py` - JWT authentication, rate limiting
- `src/core/ai_agent.py` - Call coordination logic
- `src/storage/supabase_client.py` - Database operations
- `src/telephony/manager.py` - FreePBX integration

**API Endpoints:**
```python
# Authentication
POST /auth/login             # Admin login (manual user management)
GET  /auth/me               # Get current user

# Call Management
POST /calls/initiate        # Start voice survey call
POST /calls/{id}/respond    # Process response
GET  /calls/status          # Call status

# Customer Management
GET  /customers             # List customers
POST /customers/upload      # Upload Excel customer list
POST /customers/start-calling # Start calling campaign

# Billing & Credits
GET  /billing/status        # Credit balance
POST /billing/add-credits   # Admin add credits

# Admin Dashboard
GET  /admin/institutions    # List institutions
GET  /admin/statistics      # System statistics
```

### **4. Next.js Frontend (`frontend`)**

**Purpose:** Modern dashboard with TypeScript, SSR, better UX

**Pages to Create:**
- `/dashboard` - Main dashboard with stats
- `/calls` - Call management interface
- `/customers` - Customer list management
- `/reports` - Data export interface
- `/admin` - Super admin dashboard

**API Routes (Next.js):**
- `/api/auth/*` - Authentication proxy to API service
- `/api/calls/*` - Call management proxy
- `/api/export/*` - Data export proxy

---

## 🗃️ **DATABASE SCHEMA (Supabase)**

### **Tables to Create:**

```sql
-- User profiles (Supabase Auth extension)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  call_credits_free INTEGER DEFAULT 10,
  call_credits_paid INTEGER DEFAULT 0,
  total_calls_made INTEGER DEFAULT 0,
  total_successful_calls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Institutions (hospitals/clients)
institutions (
  id SERIAL PRIMARY KEY,
  saas_user_id UUID REFERENCES profiles(id),
  institution_name TEXT NOT NULL,
  client_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers/patients for calling
customers (
  id SERIAL PRIMARY KEY,
  client_id TEXT REFERENCES institutions(client_id),
  name TEXT NOT NULL,  -- Arabic name for TTS
  phone_number TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT DEFAULT 'not_called', -- not_called, completed, failed
  priority INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey responses
survey_responses (
  id SERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  client_id TEXT REFERENCES institutions(client_id),
  customer_id INTEGER REFERENCES customers(id),
  department TEXT NOT NULL,
  patient_id TEXT,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  response TEXT NOT NULL, -- yes/no/uncertain
  confidence FLOAT DEFAULT 0.0,
  answered BOOLEAN DEFAULT TRUE,
  speech_text TEXT,
  audio_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  survey_version TEXT DEFAULT '1.0'
);

-- Call logs for analytics
call_logs (
  id SERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  client_id TEXT REFERENCES institutions(client_id),
  patient_id TEXT,
  department TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'initiated', -- initiated, completed, failed
  call_duration INTEGER,
  call_cost DECIMAL(10,2),
  provider TEXT,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 **AUTHENTICATION & SECURITY**

### **Manual User Management:**
- Only super admin can create users via dashboard
- No public sign-up flow
- Users created with initial free credits

### **JWT Token Flow:**
1. Admin logs in via `/auth/login`
2. Returns JWT token with user role
3. Token used for all API calls
4. Rate limiting per IP/user

### **Environment Security:**
```bash
# Required environment variables
JWT_SECRET_KEY=super-secret-key-change-in-production
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key
FREEPBX_HOST=your-freepbx-host
FREEPBX_USERNAME=ami-username
FREEPBX_PASSWORD=ami-password
```

---

## 🎙️ **VOICE PROCESSING PIPELINE**

### **Saudi Arabic Optimization:**
- **TTS Voice:** "nova" (female, best for Arabic)
- **Speech Speed:** 0.90-0.95 for clarity
- **Text Optimization:** Common Arabic phrase normalization
- **Dialect Patterns:** Saudi yes/no/uncertain classification

### **Audio File Management:**
- Generate WAV files for each question
- Cache generated audio to avoid duplication
- Automatic cleanup of old files
- File validation and format checking

---

## 📊 **DATA EXPORT SYSTEM**

### **Arabic Excel Formatting:**
- Right-to-left text alignment
- Arabic column headers
- Bilingual support (Arabic/English)
- Multiple sheet reports

### **Export Formats:**
- Excel (.xlsx) with Arabic formatting
- JSON for API consumption
- Comprehensive reports with statistics

---

## 📞 **TELEPHONY INTEGRATION**

### **FreePBX Configuration:**
```json
{
  "provider": "freepbx",
  "host": "${FREEPBX_HOST}",
  "port": 5038,
  "username": "${FREEPBX_USERNAME}",
  "password": "${FREEPBX_PASSWORD}",
  "caller_id": "HanaVoiceSaaS"
}
```

### **Saudi-Specific Settings:**
- Country code: +966
- Business hours: 08:00-22:00 (Asia/Riyadh)
- Area code validation
- Emergency number recognition

---

## 🚀 **DEPLOYMENT CONFIGURATION**

### **Docker Compose (Development):**
```yaml
version: '3.8'
services:
  api-service:
    build: ./api-service
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=postgresql://...
      
  voice-service:
    build: ./voice-service
    ports: ["8001:8001"]
    
  data-service:
    build: ./data-service
    ports: ["8002:8002"]
    
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
```

### **Render Configuration (`render.yaml`):**
```yaml
services:
  - type: web
    name: api-service
    env: python
    plan: standard
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn src.main:app --host 0.0.0.0 --port 8000
    
  - type: web
    name: voice-service
    env: python
    plan: standard
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn src.main:app --host 0.0.0.0 --port 8001
    
  - type: web
    name: data-service
    env: python
    plan: standard
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn src.main:app --host 0.0.0.0 --port 8002
    
  - type: web
    name: frontend
    env: node
    plan: standard
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NEXT_PUBLIC_API_URL
        value: https://api-service.onrender.com
```

---

## 📈 **MIGRATION PHASES**

### **Phase 1: Foundation (Week 1)**
- [ ] Set up project structure with 4 services
- [ ] Implement database schema in Supabase
- [ ] Create basic FastAPI skeleton for each service
- [ ] Set up Next.js frontend with TypeScript

### **Phase 2: Core Services (Week 2)**
- [ ] Implement voice processing service (TTS/STT)
- [ ] Implement data export service (Excel/JSON)
- [ ] Implement API gateway with authentication
- [ ] Create basic dashboard pages

### **Phase 3: Integration (Week 3)**
- [ ] Integrate FreePBX telephony
- [ ] Implement call coordination logic
- [ ] Add Arabic Excel formatting
- [ ] Create comprehensive reporting

### **Phase 4: Polish & Deploy (Week 4)**
- [ ] Add error handling and logging
- [ ] Implement rate limiting and security
- [ ] Set up Docker configuration
- [ ] Deploy to Render and test end-to-end

---

## 🎯 **SUCCESS CRITERIA**

### **Technical Metrics:**
- API response time < 200ms
- Arabic TTS comprehension > 90%
- Call success rate > 85%
- System uptime > 99.5%

### **Business Metrics:**
- Support 5+ hospitals simultaneously
- Process 100+ calls per hour
- Generate Arabic Excel reports in < 30 seconds
- Maintain < 1% error rate in voice classification

---

## 📋 **IMPLEMENTATION PRIORITIES**

### **High Priority (Must Have):**
1. Saudi Arabic voice processing pipeline
2. FreePBX telephony integration
3. Supabase database with proper schemas
4. Arabic Excel export functionality
5. Super admin dashboard for user management

### **Medium Priority (Should Have):**
1. Rate limiting and security
2. Comprehensive error handling
3. Performance optimization
4. Detailed logging and monitoring

### **Low Priority (Nice to Have):**
1. Advanced analytics dashboard
2. Multi-language support
3. Advanced call retry logic
4. WebSocket real-time updates

---

## 🔄 **LEGACY CODE REFERENCE**

**Note to Implementing AI:** Reference the existing codebase for business logic, but rebuild from scratch using modern patterns. Key files to understand:

- `src/core/voice_utils.py` - Saudi Arabic TTS optimization
- `src/core/stt_tts.py` - Saudi dialect classification
- `src/core/export_utils.py` - Arabic Excel formatting
- `src/core/ai_agent.py` - Call coordination logic
- `config/telephony.json` - FreePBX configuration

**Do NOT copy-paste code** - understand the patterns and reimplement with better architecture.

---

## 🏁 **START IMPLEMENTATION**

**Begin with Phase 1:** Set up the 4-service architecture with proper Docker configuration and Supabase database setup. Focus on getting the basic services communicating before implementing complex business logic.

**Key First Steps:**
1. Create the 4 service directories with basic structure
2. Set up Supabase project with the specified schema
3. Create Docker configuration for local development
4. Implement basic health check endpoints for all services

This plan provides everything needed to build a production-ready Hana Voice SaaS system from scratch.
