-- ========================================
-- Update activatedAt for Existing Keys
-- ========================================
-- This script updates existing keys that have NULL activatedAt
-- Run this ONCE in your Supabase SQL Editor after deploying the code fixes
-- ========================================

-- For existing keys with NULL activatedAt, set it to their createdAt date
-- This gives them a reasonable activation date based on when they were created
UPDATE license_keys
SET "activatedAt" = "createdAt"
WHERE "activatedAt" IS NULL;

-- Verify the update
SELECT 
    COUNT(*) as total_keys,
    COUNT("activatedAt") as keys_with_activated_at,
    COUNT(*) - COUNT("activatedAt") as keys_with_null_activated_at
FROM license_keys;

-- Show sample of updated keys
SELECT 
    key,
    email,
    "createdAt",
    "activatedAt",
    "expiresAt",
    "keyType"
FROM license_keys
ORDER BY "createdAt" DESC
LIMIT 10;

-- ========================================
-- Expected Result:
-- After running this, all keys should have activatedAt set
-- keys_with_null_activated_at should be 0
-- ========================================

