-- Telephony Settings Table Schema
-- This table stores configuration for telephony providers like Maqsam

CREATE TABLE IF NOT EXISTS telephony_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'maqsam' CHECK (provider IN ('maqsam')),
  auth_method TEXT NOT NULL CHECK (auth_method IN ('http_header', 'websocket_token')),
  auth_token TEXT NOT NULL,
  base_url TEXT NOT NULL,
  webhook_url TEXT,
  allowed_agents TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  test_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active settings
CREATE INDEX IF NOT EXISTS idx_telephony_settings_active ON telephony_settings(is_active);

-- Create index for provider
CREATE INDEX IF NOT EXISTS idx_telephony_settings_provider ON telephony_settings(provider);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_telephony_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_telephony_settings_updated_at
  BEFORE UPDATE ON telephony_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_telephony_settings_updated_at();

-- Insert sample configuration for testing
INSERT INTO telephony_settings (
  provider,
  auth_method,
  auth_token,
  base_url,
  webhook_url,
  allowed_agents,
  is_active,
  test_mode
) VALUES (
  'maqsam',
  'http_header',
  'your-pre-shared-token-here',
  'wss://your-service.com',
  'https://your-service.com/api/webhooks',
  ARRAY['ar', 'en', 'support'],
  false,
  true
) ON CONFLICT DO NOTHING;
