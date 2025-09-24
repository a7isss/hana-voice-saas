-- Hana Voice SaaS - Supabase Database Schema
-- This script creates the complete database structure for the Hana Voice SaaS platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table (extends Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    call_credits_free INTEGER DEFAULT 10,
    call_credits_paid INTEGER DEFAULT 0,
    total_calls_made INTEGER DEFAULT 0,
    total_successful_calls INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create institutions table (hospitals/clients)
CREATE TABLE institutions (
    id SERIAL PRIMARY KEY,
    saas_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    institution_name TEXT NOT NULL,
    client_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers/patients table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    client_id TEXT REFERENCES institutions(client_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    department TEXT NOT NULL CHECK (department IN (
        'cardiology', 'dermatology', 'emergency', 'endocrinology', 'ent',
        'general_practitioner', 'generic_healthcare', 'laboratory', 'neurology',
        'obstetrics_gynecology', 'oncology', 'ophthalmology', 'orthopedics',
        'pediatrics', 'pharmacy', 'physical_therapy', 'psychiatry', 'radiology',
        'surgery', 'urology'
    )),
    status TEXT DEFAULT 'not_called' CHECK (status IN ('not_called', 'in_progress', 'completed', 'failed')),
    priority INTEGER DEFAULT 0,
    notes TEXT,
    last_call_attempt TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create survey responses table
CREATE TABLE survey_responses (
    id SERIAL PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    client_id TEXT REFERENCES institutions(client_id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    patient_id TEXT,
    question_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    response TEXT NOT NULL CHECK (response IN ('yes', 'no', 'uncertain')),
    confidence FLOAT DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    answered BOOLEAN DEFAULT TRUE,
    speech_text TEXT,
    audio_url TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    survey_version TEXT DEFAULT '1.0'
);

-- Create call logs table for analytics
CREATE TABLE call_logs (
    id SERIAL PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    client_id TEXT REFERENCES institutions(client_id) ON DELETE CASCADE,
    patient_id TEXT,
    department TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'answered', 'completed', 'failed', 'busy', 'no_answer')),
    call_duration INTEGER,
    call_cost DECIMAL(10,2) DEFAULT 0.00,
    provider TEXT DEFAULT 'freepbx',
    error_message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create credit transactions table
CREATE TABLE credit_transactions (
    id SERIAL PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('call_charge', 'credit_purchase', 'free_credit')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    call_log_id INTEGER REFERENCES call_logs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audio files table for caching
CREATE TABLE audio_files (
    id SERIAL PRIMARY KEY,
    text_hash TEXT UNIQUE NOT NULL,
    text_content TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    voice_model TEXT DEFAULT 'nova',
    language TEXT DEFAULT 'ar',
    duration FLOAT,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_institutions_client_id ON institutions(client_id);
CREATE INDEX idx_institutions_saas_user_id ON institutions(saas_user_id);
CREATE INDEX idx_customers_client_id ON customers(client_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_department ON customers(department);
CREATE INDEX idx_survey_responses_conversation_id ON survey_responses(conversation_id);
CREATE INDEX idx_survey_responses_client_id ON survey_responses(client_id);
CREATE INDEX idx_survey_responses_timestamp ON survey_responses(timestamp);
CREATE INDEX idx_call_logs_conversation_id ON call_logs(conversation_id);
CREATE INDEX idx_call_logs_timestamp ON call_logs(timestamp);
CREATE INDEX idx_audio_files_text_hash ON audio_files(text_hash);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Policies for institutions
CREATE POLICY "Users can view own institutions" ON institutions FOR SELECT USING (saas_user_id = auth.uid());
CREATE POLICY "Users can manage own institutions" ON institutions FOR ALL USING (saas_user_id = auth.uid());
CREATE POLICY "Admins can view all institutions" ON institutions FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Policies for customers
CREATE POLICY "Users can view own customers" ON customers FOR SELECT USING (EXISTS (SELECT 1 FROM institutions WHERE client_id = customers.client_id AND saas_user_id = auth.uid()));
CREATE POLICY "Users can manage own customers" ON customers FOR ALL USING (EXISTS (SELECT 1 FROM institutions WHERE client_id = customers.client_id AND saas_user_id = auth.uid()));

-- Policies for survey_responses
CREATE POLICY "Users can view own survey responses" ON survey_responses FOR SELECT USING (EXISTS (SELECT 1 FROM institutions WHERE client_id = survey_responses.client_id AND saas_user_id = auth.uid()));

-- Policies for call_logs
CREATE POLICY "Users can view own call logs" ON call_logs FOR SELECT USING (EXISTS (SELECT 1 FROM institutions WHERE client_id = call_logs.client_id AND saas_user_id = auth.uid()));

-- Policies for credit_transactions
CREATE POLICY "Users can view own credit transactions" ON credit_transactions FOR SELECT USING (profile_id = auth.uid());

-- Policies for audio_files (public read, authenticated write)
CREATE POLICY "Anyone can view audio files" ON audio_files FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert audio files" ON audio_files FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default super admin (will be created manually via Supabase Auth)
-- Note: After creating a user via Supabase Auth, run:
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'admin@hana-voice.com';

-- Create function to handle call credit deduction
CREATE OR REPLACE FUNCTION deduct_call_credit(
    p_profile_id UUID,
    p_call_log_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_free_credits INTEGER;
    v_paid_credits INTEGER;
    v_total_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT call_credits_free, call_credits_paid 
    INTO v_free_credits, v_paid_credits
    FROM profiles 
    WHERE id = p_profile_id;
    
    v_total_credits := v_free_credits + v_paid_credits;
    
    -- Check if user has credits
    IF v_total_credits <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct from free credits first, then paid
    IF v_free_credits > 0 THEN
        UPDATE profiles 
        SET call_credits_free = call_credits_free - 1,
            total_calls_made = total_calls_made + 1
        WHERE id = p_profile_id;
    ELSE
        UPDATE profiles 
        SET call_credits_paid = call_credits_paid - 1,
            total_calls_made = total_calls_made + 1
        WHERE id = p_profile_id;
    END IF;
    
    -- Record the transaction
    INSERT INTO credit_transactions (profile_id, transaction_type, amount, call_log_id, description)
    VALUES (p_profile_id, 'call_charge', 0.50, p_call_log_id, 'Voice survey call charge');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark call as successful and update statistics
CREATE OR REPLACE FUNCTION mark_call_successful(
    p_call_log_id INTEGER,
    p_duration INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE call_logs 
    SET status = 'completed',
        call_duration = p_duration,
        call_cost = 0.50
    WHERE id = p_call_log_id;
    
    -- Update customer status
    UPDATE customers 
    SET status = 'completed',
        last_call_attempt = NOW()
    WHERE id = (SELECT customer_id FROM call_logs WHERE id = p_call_log_id);
    
    -- Update profile statistics
    UPDATE profiles 
    SET total_successful_calls = total_successful_calls + 1
    WHERE id = (SELECT saas_user_id FROM institutions WHERE client_id = (SELECT client_id FROM call_logs WHERE id = p_call_log_id));
END;
$$ LANGUAGE plpgsql;

-- Create view for dashboard statistics
CREATE VIEW dashboard_stats AS
SELECT 
    p.id as profile_id,
    p.email,
    p.full_name,
    p.role,
    p.call_credits_free,
    p.call_credits_paid,
    p.total_calls_made,
    p.total_successful_calls,
    COUNT(DISTINCT i.id) as institution_count,
    COUNT(DISTINCT c.id) as customer_count,
    COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as completed_calls,
    COUNT(DISTINCT CASE WHEN c.status = 'failed' THEN c.id END) as failed_calls
FROM profiles p
LEFT JOIN institutions i ON p.id = i.saas_user_id
LEFT JOIN customers c ON i.client_id = c.client_id
GROUP BY p.id, p.email, p.full_name, p.role;

COMMENT ON TABLE profiles IS 'User profiles extending Supabase Auth';
COMMENT ON TABLE institutions IS 'Healthcare institutions/hospitals';
COMMENT ON TABLE customers IS 'Patients/customers for voice surveys';
COMMENT ON TABLE survey_responses IS 'Individual survey question responses';
COMMENT ON TABLE call_logs IS 'Call attempt logs and analytics';
COMMENT ON TABLE credit_transactions IS 'Credit usage and purchase history';
COMMENT ON TABLE audio_files IS 'Cached audio files for TTS optimization';
