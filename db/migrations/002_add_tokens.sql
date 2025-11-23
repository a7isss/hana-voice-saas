-- =======================================================================
-- MIGRATION: ADD TOKEN SYSTEM
-- =======================================================================

BEGIN;

-- 1. Add token_balance to hospitals table
ALTER TABLE hospitals 
ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0;

-- 2. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    amount INTEGER NOT NULL, -- Positive for recharge, negative for usage
    transaction_type VARCHAR(50) NOT NULL, -- 'recharge', 'call_usage', 'admin_adjustment'
    description TEXT,
    reference_id UUID, -- Can link to a call_session_id or payment_id
    created_by UUID, -- User who initiated the transaction (null for system)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_transactions_hospital 
        FOREIGN KEY (hospital_id) 
        REFERENCES hospitals(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_transactions_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_hospital_id ON transactions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- 4. Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. Record migration
INSERT INTO schema_migrations (version, name, checksum)
VALUES (2, 'add_tokens', md5('add_tokens_v1'))
ON CONFLICT (version) DO NOTHING;

COMMIT;
