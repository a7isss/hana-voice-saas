-- =======================================================================
-- HANA VOICE SaaS - SAFE DATABASE INITIALIZATION
-- This script can be run multiple times safely (idempotent)
-- =======================================================================

-- Start transaction for atomic execution
BEGIN;

-- =======================================================================
-- MIGRATION TRACKING SYSTEM
-- =======================================================================

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(64) -- For verification
);

-- Check if this migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = 1) THEN
        RAISE NOTICE 'Migration version 1 already applied. Skipping...';
        -- Exit the transaction
        ROLLBACK;
        RETURN;
    END IF;
END $$;

-- =======================================================================
-- ENABLE EXTENSIONS
-- =======================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =======================================================================
-- CREATE ENUMS (Only if they don't exist)
-- =======================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'hospital_admin', 'hospital_staff', 'analyst');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =======================================================================
-- CREATE TABLES (Using CREATE TABLE IF NOT EXISTS)
-- =======================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'hospital_staff',
    is_active BOOLEAN DEFAULT true,
    hospital_id UUID,
    avatar_url VARCHAR(500),
    phone_number VARCHAR(20),
    department VARCHAR(100),
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- Password resets
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospitals
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Saudi Arabia',
    hospital_type VARCHAR(50),
    department_focus TEXT[],
    contract_status VARCHAR(20) DEFAULT 'active',
    subscription_tier VARCHAR(20) DEFAULT 'standard',
    monthly_call_limit INTEGER DEFAULT 1000,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    data_encryption_enabled BOOLEAN DEFAULT true,
    audit_log_enabled BOOLEAN DEFAULT true,
    established_year INTEGER,
    website VARCHAR(500),
    emergency_contact VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospital departments
CREATE TABLE IF NOT EXISTS hospital_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    description TEXT,
    phone_extension VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    full_name_ar VARCHAR(200),
    national_id VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    medical_record_number VARCHAR(50),
    department VARCHAR(100),
    current_condition TEXT,
    priority_level VARCHAR(20) DEFAULT 'medium',
    phone_number VARCHAR(20) NOT NULL,
    alternative_phone VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    status VARCHAR(30) DEFAULT 'active',
    last_visit_date DATE,
    next_appointment_date DATE,
    automated_calls_consent BOOLEAN DEFAULT false,
    preferred_language VARCHAR(10) DEFAULT 'ar',
    preferred_call_time VARCHAR(20) DEFAULT 'morning',
    sms_notifications BOOLEAN DEFAULT false,
    email_notifications BOOLEAN DEFAULT false,
    created_by UUID,
    assigned_doctor UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient notes
CREATE TABLE IF NOT EXISTS patient_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL,
    created_by UUID NOT NULL,
    note_type VARCHAR(50),
    note_text TEXT NOT NULL,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey templates
CREATE TABLE IF NOT EXISTS survey_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    description_ar TEXT,
    target_audience VARCHAR(50),
    estimated_duration_minutes INTEGER DEFAULT 5,
    is_system_template BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospital surveys
CREATE TABLE IF NOT EXISTS hospital_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    template_id UUID,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    description_ar TEXT,
    medical_condition VARCHAR(100),
    department VARCHAR(100),
    target_audience VARCHAR(50),
    max_attempts INTEGER DEFAULT 3,
    call_window_start TIME DEFAULT '08:00:00'::time,
    call_window_end TIME DEFAULT '22:00:00'::time,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey questions
CREATE TABLE IF NOT EXISTS survey_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    question_text_ar TEXT NOT NULL,
    question_order INTEGER NOT NULL,
    question_type VARCHAR(30),
    expected_responses TEXT[] DEFAULT ARRAY['نعم', 'لا'],
    min_rating INTEGER,
    max_rating INTEGER,
    allow_multiple_responses BOOLEAN DEFAULT false,
    critical_question BOOLEAN DEFAULT false,
    follow_up_action VARCHAR(50),
    pause_seconds INTEGER DEFAULT 5,
    max_response_time INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    survey_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    description_ar TEXT,
    patient_selection_criteria JSONB,
    target_patient_count INTEGER,
    included_patient_ids UUID[],
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(30) DEFAULT 'draft',
    total_calls_scheduled INTEGER DEFAULT 0,
    total_calls_completed INTEGER DEFAULT 0,
    total_calls_failed INTEGER DEFAULT 0,
    success_rate_target DECIMAL(5,2) DEFAULT 0.8,
    response_rate_target DECIMAL(5,2) DEFAULT 0.6,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call sessions
CREATE TABLE IF NOT EXISTS call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    survey_id UUID NOT NULL,
    call_sid VARCHAR(100) UNIQUE,
    maqsam_call_id VARCHAR(100),
    conversation_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'queued',
    current_question_index INTEGER DEFAULT -1,
    total_questions INTEGER NOT NULL,
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    call_duration_seconds INTEGER,
    voice_quality_score DECIMAL(3,1),
    user_experience_rating INTEGER,
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey responses
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_session_id UUID NOT NULL,
    question_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    response_value VARCHAR(500),
    response_confidence DECIMAL(5,4),
    response_duration_seconds DECIMAL(5,2),
    medical_follow_up_required BOOLEAN DEFAULT false,
    medical_notes TEXT,
    question_number INTEGER NOT NULL,
    response_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice recordings
CREATE TABLE IF NOT EXISTS voice_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_session_id UUID NOT NULL,
    question_id UUID,
    supabase_file_path TEXT NOT NULL,
    file_size_bytes INTEGER,
    audio_duration_seconds DECIMAL(5,2),
    audio_format VARCHAR(10) DEFAULT 'webm',
    voice_quality_score DECIMAL(3,1),
    noise_level_score DECIMAL(3,1),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign analytics
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID UNIQUE NOT NULL,
    hospital_id UUID NOT NULL,
    total_calls INTEGER DEFAULT 0,
    answered_calls INTEGER DEFAULT 0,
    completed_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    average_call_duration_seconds DECIMAL(6,1),
    survey_completion_rate DECIMAL(5,4),
    average_questions_answered DECIMAL(5,2),
    satisfaction_score DECIMAL(3,1),
    success_rate DECIMAL(5,4),
    total_responses INTEGER DEFAULT 0,
    positive_responses INTEGER DEFAULT 0,
    negative_responses INTEGER DEFAULT 0,
    neutral_responses INTEGER DEFAULT 0,
    critical_responses INTEGER DEFAULT 0,
    appointments_scheduled INTEGER DEFAULT 0,
    follow_up_calls_needed INTEGER DEFAULT 0,
    urgent_cases_identified INTEGER DEFAULT 0,
    cost_per_call DECIMAL(5,2),
    cost_per_response DECIMAL(5,2),
    cost_per_completion DECIMAL(5,2),
    roi_percentage DECIMAL(5,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard metrics
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID UNIQUE,
    active_calls_count INTEGER DEFAULT 0,
    queued_calls_count INTEGER DEFAULT 0,
    today_calls_completed INTEGER DEFAULT 0,
    today_responses_collected INTEGER DEFAULT 0,
    today_success_rate DECIMAL(5,4),
    this_week_calls INTEGER DEFAULT 0,
    this_month_calls INTEGER DEFAULT 0,
    this_month_success_rate DECIMAL(5,4),
    average_call_duration DECIMAL(5,1),
    most_active_hour INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled appointments
CREATE TABLE IF NOT EXISTS scheduled_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_session_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    hospital_id UUID NOT NULL,
    appointment_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type VARCHAR(50),
    assigned_doctor_id UUID,
    department VARCHAR(100),
    room VARCHAR(50),
    location_details TEXT,
    status VARCHAR(30) DEFAULT 'scheduled',
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    patient_notified BOOLEAN DEFAULT false,
    sms_reminder_sent BOOLEAN DEFAULT false,
    email_confirmation_sent BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    hospital_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health
CREATE TABLE IF NOT EXISTS system_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(20),
    response_time_ms INTEGER,
    error_message TEXT,
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    active_connections INTEGER,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template versions
CREATE TABLE IF NOT EXISTS template_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID UNIQUE NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    target_audience VARCHAR(50),
    estimated_duration_minutes INTEGER DEFAULT 5,
    is_published BOOLEAN DEFAULT false,
    questions_json JSONB NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, version)
);

-- Template responses
CREATE TABLE IF NOT EXISTS template_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL,
    template_version_id UUID,
    patient_id UUID NOT NULL,
    hospital_id UUID NOT NULL,
    campaign_id UUID,
    call_session_id UUID,
    question_count INTEGER NOT NULL,
    answered_question_count INTEGER NOT NULL,
    answers_json JSONB NOT NULL,
    metadata_json JSONB DEFAULT '{}',
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time_seconds INTEGER,
    completion_rate DECIMAL(5,2),
    response_hash VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospital signup requests
CREATE TABLE IF NOT EXISTS hospital_signup_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    hospital_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    review_notes TEXT,
    UNIQUE(user_id)
);

-- =======================================================================
-- ADD FOREIGN KEY CONSTRAINTS (Only if they don't exist)
-- =======================================================================

DO $$ 
BEGIN
    -- Add foreign keys only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_created_by') THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_password_resets_user') THEN
        ALTER TABLE password_resets ADD CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_hospital_departments_hospital') THEN
        ALTER TABLE hospital_departments ADD CONSTRAINT fk_hospital_departments_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_patients_hospital') THEN
        ALTER TABLE patients ADD CONSTRAINT fk_patients_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_patient_notes_patient') THEN
        ALTER TABLE patient_notes ADD CONSTRAINT fk_patient_notes_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_hospital_surveys_hospital') THEN
        ALTER TABLE hospital_surveys ADD CONSTRAINT fk_hospital_surveys_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_survey_questions_survey') THEN
        ALTER TABLE survey_questions ADD CONSTRAINT fk_survey_questions_survey FOREIGN KEY (survey_id) REFERENCES hospital_surveys(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_campaigns_hospital') THEN
        ALTER TABLE campaigns ADD CONSTRAINT fk_campaigns_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_campaigns_survey') THEN
        ALTER TABLE campaigns ADD CONSTRAINT fk_campaigns_survey FOREIGN KEY (survey_id) REFERENCES hospital_surveys(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_call_sessions_campaign') THEN
        ALTER TABLE call_sessions ADD CONSTRAINT fk_call_sessions_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_call_sessions_patient') THEN
        ALTER TABLE call_sessions ADD CONSTRAINT fk_call_sessions_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_survey_responses_call_session') THEN
        ALTER TABLE survey_responses ADD CONSTRAINT fk_survey_responses_call_session FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_voice_recordings_call_session') THEN
        ALTER TABLE voice_recordings ADD CONSTRAINT fk_voice_recordings_call_session FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_campaign_analytics_campaign') THEN
        ALTER TABLE campaign_analytics ADD CONSTRAINT fk_campaign_analytics_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_scheduled_appointments_call_session') THEN
        ALTER TABLE scheduled_appointments ADD CONSTRAINT fk_scheduled_appointments_call_session FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_hospital_signup_requests_user') THEN
        ALTER TABLE hospital_signup_requests ADD CONSTRAINT fk_hospital_signup_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_hospital_signup_requests_hospital') THEN
        ALTER TABLE hospital_signup_requests ADD CONSTRAINT fk_hospital_signup_requests_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =======================================================================
-- CREATE INDEXES (Only if they don't exist)
-- =======================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_hospital_id ON users(hospital_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hospitals_name ON hospitals(name);
CREATE INDEX IF NOT EXISTS idx_hospitals_contract_status ON hospitals(contract_status);
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone_number) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_call_sessions_campaign_id ON call_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_patient_id ON call_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_survey_responses_call_session ON survey_responses(call_session_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_hospital_id ON campaigns(hospital_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_template_responses_template_id ON template_responses(template_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_responses_answers_json ON template_responses USING GIN(answers_json);

-- =======================================================================
-- ENABLE ROW LEVEL SECURITY
-- =======================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- =======================================================================
-- INSERT SAMPLE DATA (Only if not exists)
-- =======================================================================

-- Super admin user
INSERT INTO users (email, full_name, role, is_active)
VALUES ('admin@hanavoice.com', 'Super Administrator', 'super_admin', true)
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
)
ON CONFLICT (id) DO NOTHING;

-- =======================================================================
-- CREATE UPDATE TRIGGERS
-- =======================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers (DROP IF EXISTS first to avoid errors)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hospitals_updated_at ON hospitals;
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================================================================
-- RECORD MIGRATION
-- =======================================================================

INSERT INTO schema_migrations (version, name, checksum)
VALUES (1, 'initial_schema', md5('initial_schema_v1'))
ON CONFLICT (version) DO NOTHING;

-- Commit transaction
COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database initialization completed successfully!';
    RAISE NOTICE '📊 All tables, indexes, and constraints are in place.';
    RAISE NOTICE '🔒 Row Level Security enabled on critical tables.';
    RAISE NOTICE '✨ Sample data inserted where applicable.';
END $$;
