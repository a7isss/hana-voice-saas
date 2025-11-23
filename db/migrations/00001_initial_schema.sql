-- =======================================================================
-- HANA VOICE SaaS - COMPREHENSIVE DATABASE SCHEMA
-- FUTURE-PROOF DESIGN WITH HOSPITAL DASHBOARD SUPPORT
-- =======================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =======================================================================
-- USER MANAGEMENT SYSTEM (Integrated with Hospital Access)
-- =======================================================================

-- User roles enum for comprehensive access control
CREATE TYPE user_role AS ENUM ('super_admin', 'hospital_admin', 'hospital_staff', 'analyst');

-- Users table (since currently no users registered, creating from scratch)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'hospital_admin',
    is_active BOOLEAN DEFAULT true,

    -- Hospital association for data isolation
    hospital_id UUID, -- Links to hospitals table (can be null for super_admin)

    -- Profile information
    avatar_url VARCHAR(500),
    phone_number VARCHAR(20),
    department VARCHAR(100),

    -- Account status
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Password reset functionality
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================================
-- HOSPITAL/CLIENT ORGANIZATION MANAGEMENT
-- =======================================================================

-- Hospitals/Clients table (renamed for clarity, supports multiple hospital types)
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL, -- Arabic name for localization
    description TEXT,

    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Saudi Arabia',

    -- Type and specialization
    hospital_type VARCHAR(50) CHECK (hospital_type IN ('government', 'private', 'specialized', 'clinic')),
    department_focus TEXT[], -- Array of focused departments

    -- Contract and billing
    contract_status VARCHAR(20) DEFAULT 'active' CHECK (contract_status IN ('active', 'suspended', 'trial', 'expired')),
    subscription_tier VARCHAR(20) DEFAULT 'standard' CHECK (subscription_tier IN ('basic', 'standard', 'premium')),
    monthly_call_limit INTEGER DEFAULT 1000,

    -- API access
    api_key VARCHAR(255) UNIQUE NOT NULL,

    -- Security and compliance
    data_encryption_enabled BOOLEAN DEFAULT true,
    audit_log_enabled BOOLEAN DEFAULT true,

    -- Metadata
    established_year INTEGER,
    website VARCHAR(500),
    emergency_contact VARCHAR(20),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospital departments (for better organization)
CREATE TABLE hospital_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    description TEXT,
    phone_extension VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================================
-- PATIENT MANAGEMENT SYSTEM
-- =======================================================================

-- Patients table (renamed from customers for clarity)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,

    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    full_name_ar VARCHAR(200), -- For Arabic display
    national_id VARCHAR(20), -- Saudi National ID
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),

    -- Medical information (secure)
    medical_record_number VARCHAR(50),
    department VARCHAR(100), -- Primary department/care unit
    current_condition TEXT, -- Current medical status summary
    priority_level VARCHAR(20) DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),

    -- Contact details
    phone_number VARCHAR(20) NOT NULL,
    alternative_phone VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    email VARCHAR(255),

    -- Address
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),

    -- Patient status
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased', 'transferred')),
    last_visit_date DATE,
    next_appointment_date DATE,

    -- Consent and preferences
    automated_calls_consent BOOLEAN DEFAULT false,
    preferred_language VARCHAR(10) DEFAULT 'ar',
    preferred_call_time VARCHAR(20) DEFAULT 'morning', -- morning, afternoon, evening

    -- Communication preferences
    sms_notifications BOOLEAN DEFAULT false,
    email_notifications BOOLEAN DEFAULT false,

    -- Audit and tracking
    created_by UUID REFERENCES users(id),
    assigned_doctor UUID REFERENCES users(id), -- Assigned healthcare provider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient medical notes (secure, encrypted storage)
CREATE TABLE patient_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    note_type VARCHAR(50) CHECK (note_type IN ('medical', 'call_summary', 'follow_up', 'system')),
    note_text TEXT NOT NULL,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================================
-- SURVEY & QUESTIONNAIRE SYSTEM (Enhanced for Arabic/Medical)
-- =======================================================================

-- Survey templates (reusable across hospitals)
CREATE TABLE survey_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    description_ar TEXT,
    target_audience VARCHAR(50) CHECK (target_audience IN ('patients', 'staff', 'general')),
    estimated_duration_minutes INTEGER DEFAULT 5,
    is_system_template BOOLEAN DEFAULT false, -- Pre-built Hana templates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospital-specific survey configurations
CREATE TABLE hospital_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    template_id UUID REFERENCES survey_templates(id),

    -- Survey details
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    description_ar TEXT,

    -- Medical context
    medical_condition VARCHAR(100), -- Associated condition (diabetes, cardiology, etc.)
    department VARCHAR(100), -- Target department
    target_audience VARCHAR(50) CHECK (target_audience IN ('inpatients', 'outpatients', 'discharged', 'chronic', 'general')),

    -- Call settings
    max_attempts INTEGER DEFAULT 3,
    call_window_start TIME DEFAULT '08:00:00'::time,
    call_window_end TIME DEFAULT '22:00:00'::time,

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey questions (enhanced for medical workflow)
CREATE TABLE survey_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES hospital_surveys(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_text_ar TEXT NOT NULL,
    question_order INTEGER NOT NULL,

    -- Question configuration
    question_type VARCHAR(30) CHECK (question_type IN ('yes_no', 'multiple_choice', 'rating', 'open_text', 'numeric')),
    expected_responses TEXT[] DEFAULT ARRAY['نعم', 'لا'], -- Arabic responses
    min_rating INTEGER, -- For rating questions
    max_rating INTEGER, -- For rating questions
    allow_multiple_responses BOOLEAN DEFAULT false,

    -- Medical workflow
    critical_question BOOLEAN DEFAULT false, -- Requires immediate attention
    follow_up_action VARCHAR(50), -- Escalation for critical responses

    -- Timing
    pause_seconds INTEGER DEFAULT 5 CHECK (pause_seconds BETWEEN 1 AND 30),
    max_response_time INTEGER DEFAULT 20, -- Max seconds for response

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================================
-- CAMPAIGN MANAGEMENT SYSTEM
-- =======================================================================

-- Call campaigns (manages bulk calling)
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES hospital_surveys(id),

    -- Campaign details
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    description_ar TEXT,

    -- Target selection
    patient_selection_criteria JSONB, -- Dynamic filters for patient selection
    target_patient_count INTEGER,
    included_patient_ids UUID[], -- Specific patients to include

    -- Scheduling
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Status tracking
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
    total_calls_scheduled INTEGER DEFAULT 0,
    total_calls_completed INTEGER DEFAULT 0,
    total_calls_failed INTEGER DEFAULT 0,

    -- Success metrics
    success_rate_target DECIMAL(5,2) DEFAULT 0.8, -- 80% target success rate
    response_rate_target DECIMAL(5,2) DEFAULT 0.6, -- 60% target response rate

    -- Cost tracking
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),

    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================================
-- VOICE CALL EXECUTION SYSTEM
-- =======================================================================

-- Call sessions (track individual calls)
CREATE TABLE call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES hospital_surveys(id),

    -- Call identifiers
    call_sid VARCHAR(100) UNIQUE, -- Maqsam/Twilio call identifier
    maqsam_call_id VARCHAR(100), -- Maqsam specific
    conversation_id VARCHAR(100) UNIQUE NOT NULL,

    -- Status tracking
    status VARCHAR(30) DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'answered', 'in_progress', 'completed', 'failed', 'no_answer', 'busy')),
    current_question_index INTEGER DEFAULT -1, -- -1 = greeting
    total_questions INTEGER NOT NULL,

    -- Timing
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    call_duration_seconds INTEGER,

    -- Quality metrics
    voice_quality_score DECIMAL(3,1) CHECK (voice_quality_score BETWEEN 0 AND 10),
    user_experience_rating INTEGER CHECK (user_experience_rating BETWEEN 1 AND 5),

    -- Error handling
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey responses (individual question responses)
CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_session_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES survey_questions(id),
    patient_id UUID NOT NULL REFERENCES patients(id),

    -- Response details
    response_value VARCHAR(500), -- The actual response text/value
    response_confidence DECIMAL(5,4) CHECK (response_confidence BETWEEN 0 AND 1), -- 0-1 confidence score
    response_duration_seconds DECIMAL(5,2), -- How long it took to get this response

    -- Medical classification
    medical_follow_up_required BOOLEAN DEFAULT false,
    medical_notes TEXT, -- Any clinical notes from the response

    -- Metadata
    question_number INTEGER NOT NULL, -- For ordering
    response_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice recordings storage
CREATE TABLE voice_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_session_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES survey_questions(id),

    -- File storage
    supabase_file_path TEXT NOT NULL, -- Storage path in Supabase
    file_size_bytes INTEGER,
    audio_duration_seconds DECIMAL(5,2),
    audio_format VARCHAR(10) DEFAULT 'webm', -- webm, wav, mp3

    -- Quality metrics
    voice_quality_score DECIMAL(3,1), -- 0-10 scale
    noise_level_score DECIMAL(3,1), -- 0-10 scale (lower is better)

    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================================
-- ANALYTICS & REPORTING SYSTEM
-- =======================================================================

-- Campaign analytics (pre-aggregated for fast reports)
CREATE TABLE campaign_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID UNIQUE NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id),

    -- Call statistics
    total_calls INTEGER DEFAULT 0,
    answered_calls INTEGER DEFAULT 0,
    completed_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    average_call_duration_seconds DECIMAL(6,1),

    -- Survey completion
    survey_completion_rate DECIMAL(5,4),
    average_questions_answered DECIMAL(5,2),
    satisfaction_score DECIMAL(3,1), -- Average 1-5 rating
    success_rate DECIMAL(5,4), -- Overall campaign success %

    -- Response analysis
    total_responses INTEGER DEFAULT 0,
    positive_responses INTEGER DEFAULT 0,
    negative_responses INTEGER DEFAULT 0,
    neutral_responses INTEGER DEFAULT 0,
    critical_responses INTEGER DEFAULT 0, -- Require medical attention

    -- Medical outcomes
    appointments_scheduled INTEGER DEFAULT 0,
    follow_up_calls_needed INTEGER DEFAULT 0,
    urgent_cases_identified INTEGER DEFAULT 0,

    -- Cost analysis
    cost_per_call DECIMAL(5,2),
    cost_per_response DECIMAL(5,2),
    cost_per_completion DECIMAL(5,2),
    roi_percentage DECIMAL(5,2),

    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time dashboard metrics (cached for performance)
CREATE TABLE dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID UNIQUE REFERENCES hospitals(id),

    -- Current active calls
    active_calls_count INTEGER DEFAULT 0,
    queued_calls_count INTEGER DEFAULT 0,

    -- Today's statistics
    today_calls_completed INTEGER DEFAULT 0,
    today_responses_collected INTEGER DEFAULT 0,
    today_success_rate DECIMAL(5,4),

    -- Week/month stats
    this_week_calls INTEGER DEFAULT 0,
    this_month_calls INTEGER DEFAULT 0,
    this_month_success_rate DECIMAL(5,4),

    -- System health
    average_call_duration DECIMAL(5,1),
    most_active_hour INTEGER, -- 0-23

    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================================
-- SCHEDULED APPOINTMENTS (From Survey Call Results)
-- =======================================================================

CREATE TABLE scheduled_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_session_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),

    -- Appointment details
    appointment_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type VARCHAR(50) CHECK (appointment_type IN ('consultation', 'follow_up', 'urgent', 'checkup', 'procedure')),

    -- Provider and location
    assigned_doctor_id UUID REFERENCES users(id),
    department VARCHAR(100),
    room VARCHAR(50),
    location_details TEXT,

    -- Status management
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,

    -- Communication
    patient_notified BOOLEAN DEFAULT false,
    sms_reminder_sent BOOLEAN DEFAULT false,
    email_confirmation_sent BOOLEAN DEFAULT false,

    created_by UUID REFERENCES users(id), -- Which AI/Staff created this
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================================
-- AUDIT & SECURITY LOGS
-- =======================================================================

-- Security audit trail
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- 'patient', 'call', 'survey', 'campaign', etc.
    resource_id UUID NOT NULL,
    hospital_id UUID REFERENCES hospitals(id),

    details JSONB, -- Flexible data about the action
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health monitoring
CREATE TABLE system_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL, -- 'voice_service', 'database', 'api_gateway', etc.
    status VARCHAR(20) CHECK (status IN ('healthy', 'degraded', 'critical', 'offline')),
    response_time_ms INTEGER,
    error_message TEXT,

    -- Health metrics
    cpu_usage DECIMAL(5,2), -- % CPU
    memory_usage DECIMAL(5,2), -- % Memory
    active_connections INTEGER,

    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================================
-- INDEXES FOR PERFORMANCE
-- =======================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_hospital_id ON users(hospital_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE is_active = true;

-- Hospital indexes
CREATE INDEX IF NOT EXISTS idx_hospitals_name ON hospitals(name);
CREATE INDEX IF NOT EXISTS idx_hospitals_contract_status ON hospitals(contract_status);
CREATE INDEX IF NOT EXISTS idx_hospitals_type ON hospitals(hospital_type);

-- Patient indexes
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone_number) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_patients_department ON patients(hospital_id, department);

-- Call session indexes
CREATE INDEX IF NOT EXISTS idx_call_sessions_campaign_id ON call_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_patient_id ON call_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_date ON call_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_call_sessions_conversation_id ON call_sessions(conversation_id);

-- Survey response indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_call_session ON survey_responses(call_session_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_patient ON survey_responses(patient_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_question ON survey_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_timestamp ON survey_responses(response_timestamp);

-- Campaign indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_hospital_id ON campaigns(hospital_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_schedule ON campaigns(scheduled_start, scheduled_end);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_hospital ON campaign_analytics(hospital_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_updated ON campaign_analytics(last_updated DESC);

-- Appointment indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON scheduled_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON scheduled_appointments(appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON scheduled_appointments(status);

-- =======================================================================
-- ROW LEVEL SECURITY POLICIES
-- =======================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =======================================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =======================================================================

-- Super admin
INSERT INTO users (email, full_name, role, is_active) VALUES
('admin@hanavoice.com', 'Super Administrator', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;

-- Sample hospitals
INSERT INTO hospitals (
    id, name, name_ar, description, hospital_type,
    email, phone, city, api_key, contract_status
) VALUES
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'King Faisal Hospital',
    'مستشفى الملك فيصل',
    'Leading cardiology hospital in Riyadh',
    'specialized',
    'info@kfsh.com',
    '+966112502534',
    'Riyadh',
    'kfsh_api_key_2024',
    'active'
),
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Riyadh Medical Center',
    'مركز الرياض الطبي',
    'Comprehensive healthcare center',
    'government',
    'contact@rmc.org.sa',
    '+966111234567',
    'Riyadh',
    'rmc_api_key_2024',
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- Sample hospital staff
INSERT INTO users (email, full_name, role, hospital_id, department, is_active) VALUES
(
    'doctor.ahmed@kfsh.com', 'Dr. Ahmed Al-Rashed',
    'hospital_admin', '11111111-1111-1111-1111-111111111111'::uuid,
    'Cardiology', true
),
(
    'nurse.sara@kfsh.com', 'Nurse Sara Mohamed',
    'hospital_staff', '11111111-1111-1111-1111-111111111111'::uuid,
    'Cardiology', true
)
ON CONFLICT (email) DO NOTHING;

-- Sample patients
INSERT INTO patients (
    hospital_id, first_name, phone_number, department, priority_level,
    current_condition, preferred_call_time
) VALUES
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'محمد', '+966501234567', 'Cardiology',
    'high', 'Post-cardiac surgery recovery', 'morning'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'فاطمة', '+966552345678', 'Cardiology',
    'medium', 'Heart health monitoring', 'afternoon'
)
ON CONFLICT DO NOTHING;

-- Sample survey templates
INSERT INTO survey_templates (id, name, name_ar, description, target_audience, estimated_duration_minutes) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'Post-Surgery Recovery Survey',
    'استبيان التعافي بعد العمليات الجراحية',
    'Monitor patient recovery and identify complications early',
    'patients', 8
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'Medication Adherence Survey',
    'استبيان الالتزام بالأدوية',
    'Track patient compliance with prescribed medications',
    'patients', 5
)
ON CONFLICT (id) DO NOTHING;

-- =======================================================================
-- UPDATE TRIGGERS
-- =======================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hospital_surveys_updated_at BEFORE UPDATE ON hospital_surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_appointments_updated_at BEFORE UPDATE ON scheduled_appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================================================================
-- COMPREHENSIVE COMMENTS
-- =======================================================================

-- Users and Authentication
COMMENT ON TABLE users IS 'User management with role-based access control for super admins and hospital staff';
COMMENT ON COLUMN users.role IS 'super_admin (full system access), hospital_admin (their hospital), hospital_staff (limited view-only)';
COMMENT ON COLUMN users.hospital_id IS 'For hospital staff, links to their hospital for data isolation';

-- Hospital Management
COMMENT ON TABLE hospitals IS 'Hospital/client organizations with contract and billing information';
COMMENT ON COLUMN hospitals.contract_status IS 'Active, suspended, trial, or expired status';
COMMENT ON COLUMN hospitals.department_focus IS 'Array of medical departments this hospital specializes in';

-- Patient Management
COMMENT ON TABLE patients IS 'Patient records with medical information for targeted care';
COMMENT ON COLUMN patients.priority_level IS 'Call priority: urgent (immediate), high (today), medium (this week), low (next contact)';
COMMENT ON COLUMN patients.automated_calls_consent IS 'Patient consent for automated calling (GDPR/HIPAA compliance)';

-- Survey System
COMMENT ON TABLE survey_templates IS 'Reusable survey templates that hospitals can customize';
COMMENT ON TABLE hospital_surveys IS 'Hospital-customized surveys with own questions and settings';
COMMENT ON TABLE survey_questions IS 'Individual survey questions with Arabic text and response validation';

-- Campaign System
COMMENT ON TABLE campaigns IS 'Call campaigns managing bulk-patient calling with scheduling';
COMMENT ON COLUMN campaigns.patient_selection_criteria IS 'JSON filter criteria for patient selection (age, condition, department, etc.)';
COMMENT ON COLUMN campaigns.target_patient_count IS 'Total patients this campaign aims to contact';

-- Call Execution
COMMENT ON TABLE call_sessions IS 'Real-time call tracking with session state and progress';
COMMENT ON TABLE survey_responses IS 'Individual question responses with confidence scoring';
COMMENT ON TABLE voice_recordings IS 'Audio file storage with quality metrics';

-- Analytics & Outcomes
COMMENT ON TABLE campaign_analytics IS 'Performance metrics for campaigns and success rates';
COMMENT ON TABLE scheduled_appointments IS 'Medical appointments generated from survey responses';
COMMENT ON TABLE dashboard_metrics IS 'Cached real-time metrics for hospital dashboards';

-- Security & Audit
COMMENT ON TABLE audit_logs IS 'Complete audit trail for security and compliance';
COMMENT ON TABLE password_resets IS 'Secure password reset token management';

-- =======================================================================
-- FUTURE-PROOFING NOTES
-- =======================================================================
/*
FUTURE ENHANCEMENTS READY FOR:
- Multi-language support (currently Arabic-focused)
- Advanced analytics with machine learning
- Integration with EHR systems
- Mobile app for hospital staff
- Real-time monitoring dashboards
- Automated follow-up scheduling
- NLP processing for response analysis
- Integration with pharmacy systems
- Advanced compliance reporting
- AI-powered care recommendations
- Integration with Saudi health systems
- Advanced encryption for patient data
- Automated quality assurance
- Predictive analytics for patient outcomes
*/

-- =======================================================================
-- TEMPLATE-BASED RESPONSE SYSTEM (Improved Customer Answer Recording)
-- =======================================================================

-- Template versioning system for unique IDs and evolution
CREATE TABLE template_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID UNIQUE NOT NULL, -- Base template identifier
    version INTEGER NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,

    -- Template metadata
    target_audience VARCHAR(50) CHECK (target_audience IN ('patients', 'staff', 'general')),
    estimated_duration_minutes INTEGER DEFAULT 5,
    is_published BOOLEAN DEFAULT false,

    -- Template content
    questions_json JSONB NOT NULL, -- Complete question structure
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(template_id, version) -- Each template version is unique
);

-- Template responses table (aggregated customer answers)
CREATE TABLE template_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL,
    template_version_id UUID REFERENCES template_versions(id),

    -- Core identifiers
    patient_id UUID NOT NULL,
    hospital_id UUID NOT NULL,
    campaign_id UUID, -- Optional: linked campaign
    call_session_id UUID, -- Optional: linked call session

    -- Response metadata
    question_count INTEGER NOT NULL, -- For validation/compatibility
    answered_question_count INTEGER NOT NULL, -- Actual answers provided

    -- Response data (JSONB for flexibility)
    answers_json JSONB NOT NULL, -- Sorted answers array by question_order
    metadata_json JSONB DEFAULT '{}', -- Extra context (caller info, timestamps, etc.)

    -- Timing and performance
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time_seconds INTEGER, -- Total time to complete
    completion_rate DECIMAL(5,2), -- answered/total questions

    -- Indexing and metadata
    response_hash VARCHAR(64) UNIQUE, -- For deduplication
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template responses
CREATE POLICY "super_admin_all_responses" ON template_responses
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "hospital_staff_hospital_responses" ON template_responses
FOR ALL USING (auth.jwt()->>'role' IN ('hospital_admin', 'hospital_staff', 'analyst') AND
               hospital_id IN (SELECT id FROM hospitals WHERE id = (auth.jwt()->>'hospital_id')::uuid));

-- RLS Policies for template versions
CREATE POLICY "template_versions_select" ON template_versions
FOR SELECT USING (true); -- Templates are public for published versions

CREATE POLICY "template_versions_manage" ON template_versions
FOR ALL USING (auth.jwt()->>'role' IN ('hospital_admin', 'super_admin'));

-- Indexes for performance (template responses)
CREATE INDEX IF NOT EXISTS idx_template_responses_template_id ON template_responses(template_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_responses_patient_id ON template_responses(patient_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_responses_hospital_id ON template_responses(hospital_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_responses_campaign_id ON template_responses(campaign_id) WHERE campaign_id IS NOT NULL;

-- GIN indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_template_responses_answers_json ON template_responses USING GIN(answers_json);
CREATE INDEX IF NOT EXISTS idx_template_responses_metadata_json ON template_responses USING GIN(metadata_json);

-- Update triggers
CREATE TRIGGER update_template_responses_updated_at
  BEFORE UPDATE ON template_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE template_versions IS 'Template versioning system - each published template gets unique IDs with version control';
COMMENT ON TABLE template_responses IS 'Aggregated customer responses by template - stores (template_id, question_count, sorted_answers) format';
COMMENT ON COLUMN template_versions.template_id IS 'Unique identifier shared across template versions - what you requested for unique IDs';
COMMENT ON COLUMN template_responses.answers_json IS 'Sorted answers array by question_order for consistent formatting';
COMMENT ON COLUMN template_responses.metadata_json IS 'Flexible metadata storage (caller info, response times, etc.)';
COMMENT ON COLUMN template_responses.response_hash IS 'Hash for deduplication of identical responses';

-- Sample template version for testing
INSERT INTO template_versions (
    id, template_id, version, name, name_ar, is_published,
    questions_json, description, target_audience
) VALUES
(
    '11111111-2222-3333-4444-999999999999'::uuid,
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,  -- First template unique ID
    1,
    'Patient Satisfaction Survey',
    'استبيان رضا المريض',
    true,
    '[
        {
            "id": "q1",
            "text": "هل كنت راضياً عن الخدمة المقدمة؟",
            "text_ar": "هل كنت راضياً عن الخدمة المقدمة؟",
            "order": 1,
            "type": "yes_no",
            "expected_responses": ["نعم", "لا"]
        },
        {
            "id": "q2",
            "text": "كيف تقيم مستوى النظافة؟",
            "text_ar": "كيف تقيم مستوى النظافة؟",
            "order": 2,
            "type": "rating",
            "min_rating": 1,
            "max_rating": 5,
            "expected_responses": ["1", "2", "3", "4", "5"]
        },
        {
            "id": "q3",
            "text": "هل تحتاج إلى حجز موعد؟",
            "text_ar": "هل تحتاج إلى حجز موعد؟",
            "order": 3,
            "type": "yes_no",
            "expected_responses": ["نعم", "لا"]
        }
    ]'::jsonb,
    'Standard patient satisfaction questionnaire',
    'patients'
)
ON CONFLICT (id) DO NOTHING;

COMMENT ON DATABASE CURRENT_DATABASE IS 'Hana Voice SaaS - Comprehensive Arabic Healthcare Voice Automation Platform. Complete migration with future-proofing for advanced features. Template-based response system added for improved customer answer recording.';

-- =======================================================================
-- HOSPITAL REGISTRATION APPROVAL SYSTEM
-- =======================================================================

-- Hospital signup requests table (for approval workflow)
CREATE TABLE hospital_signup_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id), -- Super admin who approved/rejected
    review_notes TEXT,
    UNIQUE(user_id) -- Only one request per user
);

-- Enable RLS
ALTER TABLE hospital_signup_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Super admins can see all, users see their own requests
CREATE POLICY "super_admin_all_requests" ON hospital_signup_requests
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "hospital_user_own_requests" ON hospital_signup_requests
FOR SELECT USING (user_id IN (
  SELECT id FROM users WHERE email = auth.jwt()->>'email'
));

-- Triggers for updated_at
CREATE TRIGGER update_hospital_signup_requests_updated_at
  BEFORE UPDATE ON hospital_signup_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE hospital_signup_requests IS 'Pending hospital signup requests awaiting super admin approval';
COMMENT ON COLUMN hospital_signup_requests.status IS 'pending (awaiting review), approved (granted access), rejected (denied access)';
COMMENT ON COLUMN hospital_signup_requests.reviewed_by IS 'Super admin user_id who made the final decision';
