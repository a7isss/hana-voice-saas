-- =====================================================
-- Hana Voice SaaS - Manual Credit Management
-- Run these SQL queries directly in Render database
-- =====================================================

-- 1. VIEW ALL SAAS USERS AND THEIR CURRENT CREDITS
SELECT
    su.id,
    su.user_id,
    su.email,
    su.full_name,
    su.call_credits_free as free_credits,
    su.call_credits_paid as paid_credits,
    (su.call_credits_free + su.call_credits_paid) as total_available,
    su.total_calls_made,
    su.total_successful_calls,
    su.created_at
FROM saas_users su
ORDER BY su.created_at DESC;

-- 2. ADD CREDITS TO A SPECIFIC USER BY EMAIL
-- Replace 'user@example.com' with actual user email
-- Replace 50 with number of credits to add
UPDATE saas_users
SET call_credits_paid = call_credits_paid + 50,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'user@example.com';

-- 3. ADD CREDITS TO A SPECIFIC USER BY USER_ID
-- Replace 'user_123' with actual user_id
-- Replace 25 with number of credits to add
UPDATE saas_users
SET call_credits_free = call_credits_free + 25,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'user_123';

-- 4. VIEW RECENT TRANSACTIONS FOR ALL USERS
SELECT
    ct.id,
    ct.saas_user_id,
    su.email,
    ct.customer_id,
    ct.transaction_type,
    ct.credits_used,
    ct.call_status,
    ct.amount_charged,
    ct.created_at
FROM call_transactions ct
JOIN saas_users su ON ct.saas_user_id = su.id
ORDER BY ct.created_at DESC
LIMIT 50;

-- 5. GET CREDIT USAGE REPORT FOR A SPECIFIC USER
-- Replace 'user@example.com' with actual email
SELECT
    'Total Credits Used' as metric,
    SUM(ct.credits_used) as value
FROM call_transactions ct
JOIN saas_users su ON ct.saas_user_id = su.id
WHERE su.email = 'user@example.com'
    AND ct.call_status = 'completed'
UNION ALL
SELECT
    'Free Credits Remaining',
    su.call_credits_free
FROM saas_users su
WHERE su.email = 'user@example.com'
UNION ALL
SELECT
    'Paid Credits Remaining',
    su.call_credits_paid
FROM saas_users su
WHERE su.email = 'user@example.com';

-- 6. RESET USER TO FREE TRIAL (10 credits)
-- Use with caution - removes all paid credits
UPDATE saas_users
SET
    call_credits_free = 10,
    call_credits_paid = 0,
    total_calls_made = 0,
    total_successful_calls = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'user@example.com';

-- 7. MANUAL CHARGE FOR SUCCESSFUL CALLS
-- Add this transaction manually if auto-billing fails
INSERT INTO call_transactions (
    saas_user_id,
    customer_id,
    transaction_type,
    credits_used,
    call_status,
    amount_charged,
    notes,
    created_at
) VALUES (
    (SELECT id FROM saas_users WHERE email = 'user@example.com'),
    123, -- customer_id
    'paid',
    1,
    'completed',
    0.50,
    'Manual charge for successful call',
    CURRENT_TIMESTAMP
);

-- 8. VERIFY CUSTOMER HAS NOT BEEN CALLED BEFORE
-- Check before allowing new call
SELECT
    c.id,
    c.name,
    c.phone_number,
    c.status,
    c.updated_at
FROM customers c
WHERE c.phone_number = '+966501234567'
    AND c.client_id = (SELECT client_id FROM institutions WHERE saas_user_id = (SELECT id FROM saas_users WHERE email = 'user@example.com'));

-- 9. MANUALLY MARK CUSTOMER AS COMPLETED
-- After successful call completion
UPDATE customers
SET
    status = 'completed',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 123;

-- 10. MONTHLY USAGE REPORT FOR ALL USERS
SELECT
    su.email,
    COUNT(ct.id) as total_calls_this_month,
    SUM(ct.credits_used) as credits_used_this_month,
    SUM(ct.amount_charged) as revenue_this_month,
    su.call_credits_free + su.call_credits_paid as current_balance
FROM saas_users su
LEFT JOIN call_transactions ct ON su.id = ct.saas_user_id
    AND ct.created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
GROUP BY su.id, su.email, su.call_credits_free, su.call_credits_paid
ORDER BY total_calls_this_month DESC NULLS LAST;

-- 11. SETUP NEW SAAS USER WITH CREDITS (Combine user creation + credits)
-- Run this pattern for new users
BEGIN;

INSERT INTO saas_users (
    user_id, email, full_name, status,
    call_credits_free, call_credits_paid,
    total_calls_made, total_successful_calls,
    created_at, updated_at
) VALUES (
    'user_new_001',
    'hospital@example.com',
    'City General Hospital',
    'active',
    10, -- Free trial
    100, -- Initial paid credits
    0, 0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) RETURNING id;

-- Then create institution (replace {saas_user_id} with returned ID)
INSERT INTO institutions (
    saas_user_id, institution_name, client_id, email,
    status, created_at, updated_at
) VALUES (
    {saas_user_id}, -- From RETURNING above
    'City General Hospital',
    'city_general_hospital',
    'hospital@example.com',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

COMMIT;

-- =====================================================
-- EMERGENCY RECOVERY SCRIPTS
-- =====================================================

-- RECOVERY: If user ran out of credits but you want to give them more
UPDATE saas_users
SET call_credits_paid = call_credits_paid + 50
WHERE email = 'emergency@example.com';

-- RECOVERY: Reset all users to minimum credits (emergency only)
UPDATE saas_users
SET call_credits_free = GREATEST(call_credits_free, 5)
WHERE call_credits_free < 5;

-- RECOVERY: Remove failed/abandoned call locks (24+ hours old)
UPDATE customers
SET status = 'not_called',
    notes = CONCAT(notes, ' | Reset by admin on ', CURRENT_TIMESTAMP)
WHERE status in ('in_progress', 'failed')
    AND updated_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
