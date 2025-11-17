# Database Initialization

This directory contains database initialization and migration scripts for Hana Voice SaaS.

## Files

### `init-safe.sql`
Safe, idempotent database initialization script that can be run multiple times without causing errors.

**Features:**
- ✅ Transaction-wrapped for atomic execution
- ✅ Idempotent (safe to run multiple times)
- ✅ Migration tracking system
- ✅ Automatic rollback on errors
- ✅ Creates all tables, indexes, and constraints
- ✅ Enables Row Level Security
- ✅ Inserts sample data
- ✅ Sets up triggers for updated_at columns

**Usage:**

**Option 1: Supabase SQL Editor (Recommended)**
1. Open Supabase dashboard
2. Go to SQL Editor
3. Copy contents of `init-safe.sql`
4. Paste and run

**Option 2: psql Command Line**
```bash
psql "postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres" < db/init-safe.sql
```

**Option 3: Node.js Script**
```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = fs.readFileSync('db/init-safe.sql', 'utf8');
await supabase.rpc('exec_sql', { sql_query: sql });
```

## Migration System

The script includes a migration tracking system:

```sql
CREATE TABLE schema_migrations (
    version INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(64)
);
```

### Check Migration Status

```sql
SELECT * FROM schema_migrations ORDER BY version DESC;
```

Expected output after initialization:
```
version | name           | applied_at           | checksum
--------|----------------|---------------------|------------------
1       | initial_schema | 2025-11-17 08:00:00 | <hash>
```

## Safety Features

### 1. Idempotent Operations
All operations use `IF NOT EXISTS` or `ON CONFLICT DO NOTHING`:
```sql
CREATE TABLE IF NOT EXISTS users (...);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
INSERT INTO users (...) ON CONFLICT (email) DO NOTHING;
```

### 2. Transaction Wrapping
Entire script runs in a transaction:
```sql
BEGIN;
  -- All operations here
COMMIT;
```

If any error occurs, all changes are rolled back automatically.

### 3. Migration Check
Script checks if migration already ran:
```sql
IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = 1) THEN
    RAISE NOTICE 'Migration already applied. Skipping...';
    ROLLBACK;
    RETURN;
END IF;
```

### 4. Foreign Key Safety
Foreign keys are added only if they don't exist:
```sql
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_hospital') THEN
    ALTER TABLE users ADD CONSTRAINT fk_users_hospital 
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id);
END IF;
```

## Verification

After running the script, verify:

### 1. Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected: 25+ tables

### 2. Indexes Created
```sql
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

Expected: 15+ indexes

### 3. Sample Data
```sql
-- Super admin user
SELECT email, role FROM users WHERE role = 'super_admin';

-- Sample hospital
SELECT name, name_ar FROM hospitals LIMIT 1;
```

### 4. Row Level Security
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

Expected: RLS enabled on users, hospitals, patients, campaigns, etc.

## Troubleshooting

### Script Fails Midway

If the script fails, the transaction will rollback automatically. Check the error message:

```sql
-- Check for active transactions
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Check for locks
SELECT * FROM pg_locks WHERE NOT granted;
```

### Migration Already Applied

If you see "Migration already applied", the database is already initialized. To re-run:

```sql
-- Only do this if you're sure you want to reset
DELETE FROM schema_migrations WHERE version = 1;
-- Then re-run init-safe.sql
```

### Foreign Key Errors

If you get foreign key constraint errors:

```sql
-- Check constraint order
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint 
WHERE contype = 'f' 
ORDER BY conname;
```

The script handles this automatically, but if issues persist, check that referenced tables exist first.

## Future Migrations

To add new migrations:

1. Create `db/migrations/002_migration_name.sql`
2. Follow the same pattern:
   ```sql
   BEGIN;
   
   -- Check if already applied
   DO $$
   BEGIN
       IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = 2) THEN
           ROLLBACK;
           RETURN;
       END IF;
   END $$;
   
   -- Your changes here
   
   -- Record migration
   INSERT INTO schema_migrations (version, name, checksum)
   VALUES (2, 'migration_name', md5('migration_name_v2'));
   
   COMMIT;
   ```

## Best Practices

1. ✅ **Always use transactions** for atomic operations
2. ✅ **Make scripts idempotent** (safe to run multiple times)
3. ✅ **Track migrations** in schema_migrations table
4. ✅ **Test locally first** before running in production
5. ✅ **Backup before migrations** (Supabase does this automatically)
6. ✅ **Use IF NOT EXISTS** for all CREATE statements
7. ✅ **Use ON CONFLICT** for INSERT statements
8. ✅ **Never delete from schema_migrations** directly

## Support

For issues or questions:
- Check `DEPLOYMENT.md` for full deployment guide
- Review `memory-bank/` for project documentation
- Open GitHub issue for bugs or feature requests
