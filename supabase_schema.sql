-- Hana Voice SaaS - Supabase Database Schema
-- This schema creates the necessary tables for the voice automation platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table - Healthcare organizations using the platform
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    api_key VARCHAR(255) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '{"voice_calls": true, "data_export": true, "analytics": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers/Patients table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    department VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    priority VARCHAR(20) DEFAULT 'medium',
    last_call_attempt TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call logs table
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    conversation_id VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    status VARCHAR(50) NOT NULL, -- 'initiated', 'ringing', 'answered', 'completed', 'failed', 'no-answer'
    call_duration INTEGER, -- in seconds
    audio_url VARCHAR(500),
    survey_id VARCHAR(100),
    language VARCHAR(10) DEFAULT 'ar',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey responses table
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    conversation_id VARCHAR(100) REFERENCES call_logs(conversation_id),
    question_id VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    response VARCHAR(50), -- 'yes', 'no', 'uncertain', or text response
    confidence DECIMAL(3,2), -- confidence score 0-1
    answered BOOLEAN DEFAULT false,
    department VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics summary table (for caching performance)
CREATE TABLE IF NOT EXISTS analytics_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    period VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_calls INTEGER DEFAULT 0,
    completed_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    total_responses INTEGER DEFAULT 0,
    yes_responses INTEGER DEFAULT 0,
    no_responses INTEGER DEFAULT 0,
    uncertain_responses INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, period, period_start)
);

-- SURVEY QUESTIONNAIRE SYSTEM TABLES

-- Surveys table - Main survey definitions
CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hospital_id VARCHAR(100) NOT NULL, -- Links to hospital/client
    department_id VARCHAR(100),
    created_by VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey questions table - Individual questions within surveys
CREATE TABLE IF NOT EXISTS survey_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL, -- Arabic question text
    question_order INTEGER NOT NULL,
    pause_seconds INTEGER DEFAULT 5 CHECK (pause_seconds BETWEEN 1 AND 20),
    expected_responses TEXT[] DEFAULT ARRAY['نعم', 'لا', 'غير متأكد'], -- Arabic responses
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice templates table - Pre-recorded audio files for surveys
CREATE TABLE IF NOT EXISTS voice_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('greeting', 'question', 'goodbye')),
    audio_file_path TEXT NOT NULL, -- Supabase storage path
    audio_duration_seconds DECIMAL(5,2),
    language VARCHAR(10) DEFAULT 'ar',
    voice_model VARCHAR(100) DEFAULT 'tts_arabic',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey call sessions table - Tracks survey call progress
CREATE TABLE IF NOT EXISTS survey_call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    call_sid VARCHAR(100) UNIQUE NOT NULL, -- Maqsam call identifier
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255), -- For future personalized calling
    hospital_id VARCHAR(100) NOT NULL,
    current_question_index INTEGER DEFAULT -1, -- -1 = greeting, 0+ = questions
    session_status VARCHAR(50) DEFAULT 'initiated' CHECK (session_status IN ('initiated', 'greeting', 'questioning', 'listening', 'completed', 'failed')),
    total_questions INTEGER NOT NULL,
    responses_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    call_duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_api_key ON clients(api_key);
CREATE INDEX IF NOT EXISTS idx_customers_client_id ON customers(client_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone_number ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_client_id ON call_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_timestamp ON call_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);
CREATE INDEX IF NOT EXISTS idx_survey_responses_conversation_id ON survey_responses(conversation_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_timestamp ON survey_responses(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_client_period ON analytics_summary(client_id, period, period_start);

-- Survey system indexes
CREATE INDEX IF NOT EXISTS idx_surveys_hospital_id ON surveys(hospital_id);
CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_order ON survey_questions(survey_id, question_order);
CREATE INDEX IF NOT EXISTS idx_voice_templates_survey_id ON voice_templates(survey_id);
CREATE INDEX IF NOT EXISTS idx_voice_templates_type ON voice_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_survey_call_sessions_survey_id ON survey_call_sessions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_call_sessions_status ON survey_call_sessions(session_status);

-- Row Level Security (RLS) Policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

-- Survey system RLS
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_call_sessions ENABLE ROW LEVEL SECURITY;

-- Sample data for testing
INSERT INTO clients (id, name, department, api_key) VALUES
('11111111-1111-1111-1111-111111111111', 'King Faisal Hospital', 'Cardiology', 'test_api_key_123'),
('22222222-2222-2222-2222-222222222222', 'Riyadh Medical Center', 'General Practice', 'test_api_key_456')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (client_id, name, phone_number, department, priority) VALUES
('11111111-1111-1111-1111-111111111111', 'أحمد محمد', '+966501234567', 'Cardiology', 'high'),
('11111111-1111-1111-1111-111111111111', 'فاطمة عبدالله', '+966552345678', 'Cardiology', 'medium'),
('22222222-2222-2222-2222-222222222222', 'خالد سعيد', '+966553456789', 'General Practice', 'low')
ON CONFLICT DO NOTHING;

-- Sample survey data for testing
INSERT INTO surveys (id, name, description, hospital_id, department_id, created_by, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'استبيان رضا المرضى - Cardiology', 'استبيان لقياس رضا المرضى في قسم القلب', 'King Faisal Hospital', 'Cardiology', 'admin', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'استبيان المتابعة الطبية', 'استبيان للمتابعة الطبية والتوعية', 'Riyadh Medical Center', 'General Practice', 'admin', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO survey_questions (id, survey_id, question_text, question_order, pause_seconds, expected_responses) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'هل تشعر بألم في الصدر؟', 1, 5, ARRAY['نعم', 'لا', 'غير متأكد']),
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'هل تتناول أدويتك بانتظام؟', 2, 5, ARRAY['نعم', 'لا', 'غير متأكد']),
('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'هل تحتاج إلى موعد طبي؟', 3, 5, ARRAY['نعم', 'لا', 'غير متأكد']),
('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'كيف تشعر اليوم؟', 1, 8, ARRAY['جيد', 'سيء', 'غير متأكد']),
('55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'هل تحتاج مساعدة طبية؟', 2, 6, ARRAY['نعم', 'لا', 'غير متأكد'])
ON CONFLICT (id) DO NOTHING;

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_summary_updated_at BEFORE UPDATE ON analytics_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Survey system triggers
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE clients IS 'Healthcare client organizations using the voice automation platform';
COMMENT ON TABLE customers IS 'Patients/customers for automated voice calls';
COMMENT ON TABLE call_logs IS 'Log of all voice call attempts and their status';
COMMENT ON TABLE survey_responses IS 'Survey responses collected from voice calls';
COMMENT ON TABLE analytics_summary IS 'Pre-aggregated analytics data for performance';

-- Survey system comments
COMMENT ON TABLE surveys IS 'Main survey definitions with hospital and department associations';
COMMENT ON TABLE survey_questions IS 'Individual questions within surveys with Arabic text and pause configuration';
COMMENT ON TABLE voice_templates IS 'Pre-recorded audio files for survey greetings, questions, and goodbyes';
COMMENT ON TABLE survey_call_sessions IS 'Tracks progress and state of survey calls in real-time';

COMMENT ON COLUMN clients.permissions IS 'JSON object defining client access permissions';
COMMENT ON COLUMN call_logs.status IS 'Current status of the call: initiated, ringing, answered, completed, failed, no-answer';
COMMENT ON COLUMN survey_responses.confidence IS 'Confidence score (0-1) of the speech recognition accuracy';

-- Survey system column comments
COMMENT ON COLUMN surveys.hospital_id IS 'Links survey to specific hospital/client';
COMMENT ON COLUMN survey_questions.pause_seconds IS 'Configurable pause time (1-20 seconds) for response collection';
COMMENT ON COLUMN survey_questions.expected_responses IS 'Array of expected Arabic responses for validation';
COMMENT ON COLUMN voice_templates.template_type IS 'Type of voice template: greeting, question, or goodbye';
COMMENT ON COLUMN voice_templates.audio_file_path IS 'Supabase storage path for the audio file';
COMMENT ON COLUMN survey_call_sessions.current_question_index IS '-1 for greeting, 0+ for question index';
COMMENT ON COLUMN survey_call_sessions.session_status IS 'Current state of the survey call session';
