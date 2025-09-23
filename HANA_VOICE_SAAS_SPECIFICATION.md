# ========================================================
# HANA VOICE SAAS - COMPLETE TECHNICAL SPECIFICATION
# ========================================================

## 🎯 **PURPOSE & MISSION**
Hana Voice SaaS is a **production-ready Arabic voice survey platform** specifically designed for Saudi Arabian healthcare institutions. It conducts automated phone surveys in flawless Saudi Arabic, using advanced AI to understand spoken responses and generate actionable insights.

**Core Mission:** Democratize Arabic voice data collection for healthcare research and quality improvement initiatives in the Kingdom of Saudi Arabia.

---

## 🏗️ **HIGH-LEVEL ARCHITECTURE**

### **System Components**
- **FastAPI Backend** (`main.py`): Main application server
- **React Dashboard** (`dashboard/src/`): Super admin management interface
- **PostgreSQL Database** (`src/storage/database.py`): Data persistence
- **OpenAI Integration**: Voice synthesis (Arabic) + speech-to-text
- **FreePBX/AMV Integration**: Telephone network connectivity
- **Containerized Deployment**: Docker + Render cloud hosting

### **Deployment Architecture**
- **Render.com Cloud Platform**: Web service + managed PostgreSQL
- **Docker Containers**: Production-optimized build
- **GitHub Actions CI/CD**: Automated deployments
- **Environment Variables**: Configuration management

### **Data Flow**
```
Excel Upload → Database → Call Coordinator → OpenAI TTS → Telephony → STT → Classification → Export
```

---

## 📋 **BUSINESS WORKFLOW**

### **Super Admin Operations (You)**
1. **Institution Onboarding**:
   - Create hospital account (`admin/setup-user`)
   - Assign unique client_id (e.g., `inst_123`)
   - Manually grant calling credits

2. **Content Management**:
   - Configure questionnaire departments
   - Generate audio files via OpenAI TTS (`api/audio/generate`)
   - Verify audio quality and completeness

3. **Operations Control**:
   - Upload patient Excel files per hospital (`api/upload-customers`)
   - Monitor calling campaigns (`telephony/manager.py`)
   - Export survey results (`export/surveys`)

4. **Revenue Management**:
   - Add call credits when paid (`admin/add-credits`)
   - Monitor usage per institution
   - Generate usage reports

### **Hospital (Customer) Interaction**
- **No direct access** - all operations handled by you
- **Data export delivery** - receive formatted Excel/JSON reports
- **Credit monitoring** - you provide usage and billing information

---

## ©️ **SYSTEM COMPONENTS SPECIFICATIONS**

### **1. MAIN APPLICATION (`main.py`)**

#### **Environment Variables Configuration**
```python
# Authentication
LOGIN_USER=admin                    # Default dashboard username
LOGIN_PASS=hana2024                # Default dashboard password

# Database
DATABASE_URL=postgresql://...      # Render auto-generated

# AI Services
OPENAI_API_KEY=sk-...              # For Arabic TTS/STT

# Deployment
ENVIRONMENT=production             # development/production
HOST=0.0.0.0
PORT=10000                         # Render assigned
DEBUG=false
```

#### **API Endpoints**

**🔐 Authentication**
- `POST /login`: Form-based authentication using `LOGIN_USER`/`LOGIN_PASS`
- Returns mock JWT for dashboard session

**🏥 Institution Management**
- `GET /api/institutions`: List all hospitals (client_id, name, email, user_id)
- `POST /admin/setup-user`: Create new hospital account
  - **Input**: `institution_name`, `email`, `user_id`
  - **Output**: `client_id`, `free_credits=10`, `status=ready`

**📊 Super Admin Dashboard**
- `GET /api/customers`: List all patients across institutions
- `POST /api/upload-customers`: Excel upload per hospital
  - **Validation**: Columns must include `name`, `phone_number`, `department`
  - **Processing**: Clean phone formats, validate Saudi numbers
- `POST /api/start-calling`: Initiate calling campaign for hospital
  - **Input**: `client_id`, `excel_index`
  - **Validation**: Hospital must have available credits
  - **Processing**: Queues up to 20 patients for calling

**🎯 Trial/Demo System**
- `POST /api/trial-call/start`: Begin demo call
  - **Input**: `phone_number`, `department`
  - **Session**: Creates `session_id` (UUID), stores in memory
  - **Validation**: Department questionnaire must exist
- `POST /api/trial-call/respond/{session_id}`: Process trial responses
  - **Classification**: Text fallback or audio processing
  - **No Persistence**: Results only in UI, cleared on logout
- `GET /api/trial-call/results/{session_id}`: Show trial results
  - **Format**: UI-friendly structure for real-time display

**🎵 Audio Management**
- `POST /api/audio/generate`: Generate audio files from JSON questionnaires
  - **API Key Handling**: Uses OpenAI key from localStorage/API request
  - **Processing**: Converts question texts to WAV files
  - **Output**: Progress logs, file generation count
- `GET /api/audio/status`: Audio file verification
  - **Validation**: Checks existence of all required audio files
  - **Reporting**: Per-questionnaire completion percentages

**🔧 System Monitoring**
- `POST /api/debug/system-test`: Comprehensive system health check
  - **Database**: Connection test
  - **Questionnaires**: JSON validation
  - **API Keys**: OpenAI configuration check
  - **Files**: Audio file existence
- `GET /api/debug/logs`: System logs (for debugging)

**📈 Billing & Export**
- `POST /admin/add-credits`: Manual credit addition
  - **Input**: `user_id`, `credits_to_add`
  - **Validation**: User exists
  - **Update**: SaaSUser table credit fields
- `GET /export/surveys`: Excel export per client
  - **Format**: Bilingual (Arabic responses + transcriptions)

### **2. DATABASE SCHEMA (`src/storage/database.py`)**

#### **Core Tables**

**🏢 Institutions**
- `id`: Primary key
- `institution_name`: Display name (Arabic)
- `client_id`: Unique identifier (`inst_{id}`)
- `email`: Contact email
- `saas_user_id`: Foreign key to SaaS users
- `status`: active/inactive
- `created_at`: Timestamp

**👥 SaaSUsers (Super Admin Customers)**
- `id`: Primary key
- `user_id`: Unique admin user ID
- `institution_name`: Hospital name
- `email`: Primary contact
- `call_credits_free`: Trial/bonus credits
- `call_credits_paid`: Purchased credits
- `status`: active/inactive
- `created_at`: Registration timestamp

**👤 Customers (Patients)**
- `id`: Primary key
- `client_id`: Institution foreign key
- `name`: Patient name (Arabic)
- `phone_number`: Saudi mobile number
- `department`: Medical department
- `status`: not_called/in_progress/completed/failed
- `priority`: Calling priority (0-10)
- `notes`: Optional notes
- `created_at`: Import timestamp
- `updated_at`: Status change timestamp

**📢 Survey Responses (Completed Calls)**
- `conversation_id`: Call session identifier
- `client_id`: Institution identifier
- `customer_id`: Patient foreign key
- `question_id`: Question identifier
- `response`: yes/no/unsure classification
- `confidence`: AI confidence score (0.0-1.0)
- `speech_text`: Full Arabic transcription
- `question_text`: Original question
- `department`: Medical department
- `created_at`: Response timestamp

**💰 Call Transactions (Billing)**
- `id`: Primary key
- `saas_user_id`: Institution owner
- `customer_id`: Patient called
- `transaction_type`: free/paid
- `credits_used`: Always 1 per call attempt
- `call_status`: initiated/connected/completed/failed
- `notes`: Details like "Super admin call"
- `created_at`: Transaction timestamp

#### **Database Rules**
- **Credit Deduction**: Always deduct BEFORE call attempt
- **Refund Logic**: Refund credits if call prep fails
- **Status Updates**: Atomic updates for consistency
- **Indexing**: Optimized for common queries (client_id, status)
- **Backups**: Hourly automated via Render

### **3. DASHBOARD INTERFACE (`dashboard/src/pages/Dashboard.js`)**

#### **Authentication**
- **No Database Login** - Uses `LOGIN_USER`/`LOGIN_PASS` env vars
- **Session Tokens** - Mock JWT for state management
- **Route Protection** - Redirects to login on invalid sessions

#### **Dashboard Tabs**

**🏥 Institution Management**
- **Grid Display**: Hospitals in responsive cards
- **Add Hospital**: Form dialog for new institutions
- **File Upload**: Individual upload per hospital
  - Accepts: `.xlsx`, `.xls`, `.csv`
  - Real-time progress indicators
  - Validation feedback
- **Credit Management**: "Add Credits" button per hospital
  - Pricing: $0.50/call, 300% markup opportunity

**📞 Call Campaigns**
- **Institution Selection**: Dropdown from active hospitals
- **Excel File Selection**: Batch management
- **Start Campaign**: Button with progress indicator
- **Credit Validation**: Prevents campaigns without credits
- **Result Feedback**: Call count confirmation

**🧪 Trial Calls**
- **Warning Display**: "Results not saved" banner
- **Phone Input**: Saudi number validation
- **Department Selection**: 4 medical specialties
- **Start Trial**: Audio survey execution
- **Real-time Results**: Live question-by-question display
- **Auto Cleanup**: Results cleared on tab change/logout

**🎵 Audio Generation**
- **API Key Input**: Persisted in localStorage
- **Generate All**: Full questionnaire audio creation
- **Progress Tracking**: Real-time file generation status
- **Status Check**: Audio file verification
- **File Count**: 16 departments × 8 questions = 128 files

**📊 Reports & Export**
- **Per-Hospital Export**: Excel download per institution
- **Data Format**: Arabic transcriptions + classifications
- **File Naming**: `surveys_{client_id}_{timestamp}.xlsx`

**🔍 System Debugging**
- **Test Suite**: Database, questionnaire, API, file system tests
- **Status Indicators**: Real-time system health
- **Log Access**: Recent operation logs
- **Error Monitoring**: Comprehensive failure detection

#### **UI Rules**
- **Right-to-Left (RTL)**: Arabic text support
- **Responsive Design**: Mobile-friendly layouts
- **Progress Indicators**: For all long-running operations
- **Error Handling**: User-friendly error messages
- **Data Validation**: Client and server-side validation

### **4. AI AGENT SYSTEM (`src/core/ai_agent.py`)**

#### **Call Coordinator**
```python
class CallCoordinator:
    def prepare_call(customer_id: int, phone: str, client_id: str):
        """
        Pre-call preparation and validation
        - Validates phone number format
        - Checks institution permissions
        - Deducts call credits
        - Gets questionnaire information
        Returns: call_data dict
        """
```

**Rules**:
- **Credit Check First**: Always validate and deduct BEFORE telephony
- **Phone Validation**: Saudi number format enforcement
- **Questionnaire Selection**: Based on patient department
- **Fallback Logic**: Refund credits on prep failure

#### **Audio Questionnaire Processor**
- **Question Management**: Load department-specific questions
- **Answer Classification**: yes/no/unsure from STT output
- **Score Calculation**: Confidence intervals for each response
- **Next Question Logic**: Standard survey flow control

### **5. TELEPHONY MANAGER (`src/telephony/manager.py`)**

#### **Adapter System**
```python
class TelephonyManager:
    def __init__(self):
        self.adapters = {
            'freepbx': FreePBXAdapter(),
            'twilio': TwilioAdapter()  # Future expansion
        }
```

#### **FreePBX Adapter**
- **AMI Connection**: Asterisk Manager Interface
- **Channel Management**: ISDN/analog line handling
- **Call Control**: Originate, DTMF detection, hangup
- **Recording**: Audio capture and storage
- **Arabic Support**: Multi-language call handling

#### **Call Flow Execution**
1. **Credit Deduction** (`src/storage/database.py`)
2. **Call Initialization** (`telephony/manager.py`)
3. **Audio Playback** (`core/ai_agent.py`)
4. **Response Recording** (`telephony/manager.py`)
5. **STT Processing** (`OpenAI API`)
6. **Classification** (`core/ai_agent.py`)
7. **Data Storage** (`storage/database.py`)

### **6. AUDIO QUESTIONNAIRE SYSTEM (`src/core/audio_questionnaire.py`)**

#### **Questionnaire Manager**
```python
class QuestionnaireManager:
    def get_questionnaire_info(questionnaire_id: str):
        """
        Load department questionnaire data
        - JSON parsing from config/surveys/
        - Question sequence validation
        - Audio file path mapping
        Returns: dict with questions and metadata
        """
    }
```

#### **Question Audio Generation**
- **OpenAI TTS Integration**: Saudi Arabic voice synthesis
- **File Format**: WAV files optimized for telephony
- **Storage**: `generated_audio/` directory structure
- **Naming Convention**: `{department}_{question_id}.wav`

#### **Response Processing Rules**
- **Arabic STT**: Full transcription using OpenAI Whispers
- **Classification Logic**:
  - "نعم/ايوه/yes/sure/نعم" → "yes"
  - "لا/مش/no/لا تود" → "no"
  - Other responses → "unsure"
- **Confidence Scoring**: 0.0-1.0 based on STT certainty

### **7. EXPORT SYSTEM (`src/core/export_utils.py`)**

#### **Excel Export Manager**
```python
def export_completed_surveys_excel(client_id: str, start_date: datetime, end_date: datetime):
    """
    Generate bilingual Excel export
    - Classifications + Full Arabic transcriptions
    - Patient metadata (name, department, phone)
    - Response timestamps and confidence scores
    - Multiple worksheets by medical department
    """
```

**Rules**:
- **Bilingual Format**: English columns + Arabic content
- **Data Anonymization**: PHI protection where required
- **File Security**: Encrypted delivery via Render
- **Export Limits**: 1000 records max per export

### **8. CONTAINERIZATION & DEPLOYMENT**

#### **Docker Configuration (`Dockerfile.production`)**
- **Base Image**: python:3.11-slim
- **Multi-stage Build**: Optimized for Render
- **Dependencies**: Only production requirements
- **Security**: Non-root user execution
- **Performance**: opencv optimization removed

#### **Render Infrastructure (`render.yaml`)**
- **Service Type**: Web service with PostgreSQL
- **Scaling**: Min 1, Max 10 instances
- **Environment**: Global environment variables
- **Domains**: Custom domain configuration
- **Monitoring**: Built-in health checks

#### **CI/CD Pipeline (`.github/workflows/deploy.yml`)**
- **Triggers**: Push to main branch
- **Build Process**: Docker build + test execution
- **Deployment**: Automatic Render update
- **Rollback**: Manual trigger capability

---

## 🔄 **COMPLETE CALL WORKFLOW**

### **Standard Paid Call**
1. **Pre-Call Preparation**:
   ```python
   # main.py:297 - /calls/initiate
   call_prep = call_coordinator.prepare_call(customer_id, phone, client_id)
   # Validates patient exists, credits available, questionnaire ready
   ```

2. **Credit Deduction**:
   ```python
   # src/storage/database.py - deduct_call_credit()
   credit_type, credits_used = deduct_call_credit(db, user_id)
   # Always 1 credit per call, returns free/paid type
   ```

3. **Telephony Initiation**:
   ```python
   # src/telephony/manager.py - initiate_call()
   call_result = telephony_manager.initiate_call(questionnaire, customer)
   # Connects to FreePBX, plays first question
   ```

4. **Interactive Survey**:
   - **First Question Playback**: Pre-recorded Saudi Arabic
   - **Response Recording**: Waiting for voice or DTMF
   - **Next Question**: Sequential from questionnaire JSON

5. **AI Processing**:
   ```python
   # Process audio response
   result = audio_questionnaire_processor.process_response(
       customer_id=customer.id,
       question_id=question_id,
       audio_response_path=audio_file
   )
   ```

6. **Data Storage**:
   ```python
   # Save classification + transcription
   survey_response = SurveyResponse(
       conversation_id=call_session_id,
       client_id=client_id,
       response=result['classification'],
       speech_text=result['original_text'],
       confidence=result['confidence']
   )
   ```

### **Trial Call (Demo Mode)**
1. **Session Creation**: In-memory only (no database)
2. **Same AI Processing**: But results not persisted
3. **Real-time UI Updates**: WebSocket or polling for results
4. **Auto Cleanup**: Session deleted on page refresh

---

## 🔧 **TECHNICAL CONSTRAINTS & RULES**

### **Performance Limits**
- **Max Calls/Second**: 5 concurrent (FreePBX limit)
- **API Rate Limits**: OpenAI, Render service limits
- **Database Queries**: Optimized for <10 institutions
- **File Upload Size**: 10MB max per Excel

### **Security Rules**
- **API Keys**: Never stored in database/folder
- **User Data**: KSA privacy laws compliance
- **Access Control**: Super admin only in MVP
- **Audit Trail**: All credit changes logged

### **Data Validation Rules**
- **Phone Numbers**: Saudi format (+966, 966 prefix, 9 digits)
- **Email Format**: Institutional validation
- **Excel Columns**: name, phone_number, department required
- **Questionnaire IDs**: {department}_v1 format

### **Error Handling Rules**
- **Graceful Degradation**: Continue processing on single failures
- **Credit Refunds**: Automatic on technical failures
- **User Feedback**: All errors shown in Arabic UI
- **Logging**: Comprehensive error tracking

---

## 📊 **MONITORING & METRICS**

### **System Health Checks**
- **Database Connection**: Every API call
- **Audio File Integrity**: Daily verification
- **Credit Balance Validation**: Real-time
- **Question Library**: Version control

### **Business Metrics**
- **Conversion Rate**: Conducted calls vs completed surveys
- **Answer Distribution**: Yes/No/Unsure percentages
- **Department Analysis**: Performance by medical specialty
- **Hospital Engagement**: Usage patterns per client

### **Operational Metrics**
- **API Response Times**: Target <200ms
- **Call Completion Rate**: >85% target
- **Credit Utilization**: Monthly tracking
- **System Uptime**: Render monitoring

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] OpenAI API key obtained ($18/month target)
- [ ] Render account configured
- [ ] Domain registered (optional)
- [ ] Email service set up
- [ ] Test hospital data prepared

### **Environment Setup**
- [ ] `DATABASE_URL` configured (auto via Render)
- [ ] `OPENAI_API_KEY` set as secret
- [ ] `LOGIN_USER`/`LOGIN_PASS` configured
- [ ] `ENVIRONMENT=production`

### **Post-Deployment**
- [ ] SSL certificate verification
- [ ] CORS configuration testing
- [ ] File upload testing
- [ ] Audio generation verification
- [ ] Trial call functionality test

### **Go-Live Checklist**
- [ ] First hospital account created
- [ ] Audio files generated for all departments
- [ ] Excel upload tested with sample data
- [ ] Calling campaign initiated
- [ ] Export functionality verified

---

## 🏆 **MVP SUCCESS CRITERIA**

### **Technical Metrics**
- **Availability**: 99.5% uptime target
- **Performance**: <3 second call setup time
- **Quality**: >90% Arabic speech recognition accuracy
- **Scalability**: Support 50+ hospitals, 1000+ daily calls

### **Business Metrics**
- **Customer Acquisition**: 5 hospitals in first month
- **Conversion Rate**: 80% call completion rate
- **Revenue Target**: $500/month average per hospital
- **Churn Rate**: <5% monthly

---

## 📞 **OPERATOR MANUAL (Your Role)**

### **Daily Operations**
1. **Morning Check**: Run system diagnostic tests
2. **Hospital Support**: Respond to onboarding requests
3. **Content Management**: Review audio quality, regenerate if needed
4. **Operations Monitoring**: Check campaign progress
5. **Customer Revenue**: Process credit purchases and add balances

### **Emergency Procedures**
- **System Down**: Switch to backup OpenAI keys
- **Audio Issues**: Regenerate corrupted files
- **Database Problems**: Use Render point-in-time restore
- **Telephony Issues**: Check FreePBX logs, restart services

### **Scaling Procedures**
- **Add New Hospital**: Same 5-step process
- **High Volume**: Add Render instances
- **New Features**: Develop in feature branches
- **Data Migration**: Export-import for schema changes

---

## 🔮 **FUTURE EXPANSIONS**

### **Phase 2 Features**
- **Hospital Dashboard**: Self-service upload/download
- **Advanced Analytics**: Sentiment analysis, trends
- **Multi-language**: Khaliji dialects, MSA variants
- **SMS Notifications**: Appointment reminders, results

### **Technical Expansions**
- **Machine Learning**: Custom Arabic models
- **Telephony**: Twilio for international expansion
- **Real-time**: WebSocket for live call monitoring
- **Mobile App**: Hospital mobile interface

---

## 📚 **RESOURCES & REFERENCES**

### **File Structure**
```
hana-voice-saas/
├── main.py                     # FastAPI application
├── dashboard/                  # React admin interface
├── src/core/                   # AI and business logic
│   ├── ai_agent.py            # Call coordination
│   ├── audio_questionnaire.py # Survey processing
│   └── stt_tts.py            # AI voice services
├── src/storage/               # Data persistence
│   └── database.py            # SQLAlchemy models
├── src/telephony/             # Telephony adapters
│   └── manager.py             # Call execution
├── config/                    # Questionnaire JSONs
└── requirements.txt           # Python dependencies
```

### **API Response Codes**
- **200**: Success
- **400**: Bad request (invalid parameters)
- **401**: Authentication required
- **402**: Insufficient credits
- **500**: Server error (check logs)

### **Configuration Files**
- `render.yaml`: Infrastructure definition
- `Dockerfile.production`: Production container
- `DEPLOYMENT_GUIDE.md`: Operations manual
- `.env.example`: Environment variables template

---

This specification is the **complete operational bible** for Hana Voice SaaS. Every component, flow, and rule is documented with exact file names and function calls. The system is **production-ready** and designed for immediate deployment to generate Arabic healthcare voice data.

**Status: MVP Complete - Ready for Saudi Healthcare Data Collection** 🇸🇦❤️
