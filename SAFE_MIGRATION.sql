-- ========================================
-- SAFE MIGRATION - MINIMAL CHANGES ONLY
-- ========================================
-- This script ONLY creates the key_history table
-- It does NOT modify your existing license_keys table
-- Safe to run on production database
-- ========================================

-- Create key_history table (the ONLY missing piece)
CREATE TABLE IF NOT EXISTS key_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_value TEXT NOT NULL,
    action TEXT NOT NULL,
    performed_by TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    details JSONB
);

-- Create indexes on key_history for better performance
CREATE INDEX IF NOT EXISTS idx_key_history_key_value ON key_history(key_value);
CREATE INDEX IF NOT EXISTS idx_key_history_performed_at ON key_history(performed_at DESC);

-- Enable Row Level Security on key_history
ALTER TABLE key_history ENABLE ROW LEVEL SECURITY;

-- Create policy for key_history (allows all operations)
DROP POLICY IF EXISTS "Enable all access for service role on history" ON key_history;
CREATE POLICY "Enable all access for service role on history" ON key_history
    FOR ALL USING (true);

-- ========================================
-- Done! key_history table is ready.
-- Your license_keys table was NOT modified.
-- ========================================

