-- ========================================
-- Migration Script for New Supabase Account
-- ========================================
-- Run this SQL in your new Supabase account SQL Editor
-- This will add the missing key_history table and required components

-- Step 1: Create LicenseKeyType enum (if not already exists)
-- Note: If this enum already exists, you'll get an error - that's OK, just continue
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LicenseKeyType') THEN
        CREATE TYPE LicenseKeyType AS ENUM ('trial', 'development', 'production');
    END IF;
END $$;

-- Step 2: Verify license_keys table has correct structure
-- If the key column is not the primary key, update it
DO $$ 
BEGIN
    -- Add primary key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'license_keys_pkey' 
        AND conrelid = 'license_keys'::regclass
    ) THEN
        ALTER TABLE license_keys ADD CONSTRAINT license_keys_pkey PRIMARY KEY (key);
    END IF;
END $$;

-- Step 3: Create indexes on license_keys if they don't exist
CREATE INDEX IF NOT EXISTS idx_license_keys_email ON license_keys(email);
CREATE INDEX IF NOT EXISTS idx_license_keys_created_at ON license_keys("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_license_keys_expires_at ON license_keys("expiresAt");
CREATE INDEX IF NOT EXISTS idx_license_keys_key_type ON license_keys("keyType");

-- Step 4: Create key_history table
CREATE TABLE IF NOT EXISTS key_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_value TEXT NOT NULL REFERENCES license_keys(key) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    details JSONB
);

-- Step 5: Create indexes on key_history
CREATE INDEX IF NOT EXISTS idx_key_history_key_value ON key_history(key_value);
CREATE INDEX IF NOT EXISTS idx_key_history_performed_at ON key_history(performed_at DESC);

-- Step 6: Enable Row Level Security (RLS)
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_history ENABLE ROW LEVEL SECURITY;

-- Step 7: Create policies (allow all operations with service role key)
-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Enable all access for service role" ON license_keys;
DROP POLICY IF EXISTS "Enable all access for service role on history" ON key_history;

-- Create new policies
CREATE POLICY "Enable all access for service role" ON license_keys
    FOR ALL USING (true);

CREATE POLICY "Enable all access for service role on history" ON key_history
    FOR ALL USING (true);

-- ========================================
-- Migration Complete!
-- ========================================

