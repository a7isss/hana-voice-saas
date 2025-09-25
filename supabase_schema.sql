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

-- Row Level Security (RLS) Policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

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

-- Comments for documentation
COMMENT ON TABLE clients IS 'Healthcare client organizations using the voice automation platform';
COMMENT ON TABLE customers IS 'Patients/customers for automated voice calls';
COMMENT ON TABLE call_logs IS 'Log of all voice call attempts and their status';
COMMENT ON TABLE survey_responses IS 'Survey responses collected from voice calls';
COMMENT ON TABLE analytics_summary IS 'Pre-aggregated analytics data for performance';

COMMENT ON COLUMN clients.permissions IS 'JSON object defining client access permissions';
COMMENT ON COLUMN call_logs.status IS 'Current status of the call: initiated, ringing, answered, completed, failed, no-answer';
COMMENT ON COLUMN survey_responses.confidence IS 'Confidence score (0-1) of the speech recognition accuracy';
COMMENT ON COLUMN analytics_summary.success_rate IS 'Percentage of successful calls (completed/total)';
