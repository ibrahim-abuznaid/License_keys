-- ========================================
-- DIAGNOSTIC QUERIES
-- Run these in Supabase SQL Editor to diagnose the issue
-- ========================================

-- Query 1: Check if license_keys table exists
SELECT 'Table Exists Check' as test_name,
       EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'license_keys'
       ) as result;

-- Query 2: Show all column names and types in license_keys table
SELECT 'Column Names' as test_name,
       column_name, 
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'license_keys'
ORDER BY ordinal_position;

-- Query 3: Count total records
SELECT 'Total Records' as test_name,
       COUNT(*) as count 
FROM license_keys;

-- Query 4: Check RLS status
SELECT 'RLS Enabled' as test_name,
       tablename, 
       rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'license_keys';

-- Query 5: Show RLS policies
SELECT 'RLS Policies' as test_name,
       policyname as policy_name,
       cmd as command,
       qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'license_keys';

-- Query 6: Sample one record to see structure
SELECT 'Sample Record' as test_name,
       * 
FROM license_keys 
LIMIT 1;

-- Query 7: Check for key_history table
SELECT 'Key History Table Exists' as test_name,
       EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'key_history'
       ) as result;

-- ========================================
-- EXPECTED RESULTS:
-- ========================================
-- 1. Table Exists Check: should return TRUE
-- 2. Column Names: should show columns like "createdAt", "email", "key", etc. (camelCase)
-- 3. Total Records: should show > 0
-- 4. RLS Enabled: should show TRUE
-- 5. RLS Policies: should show at least one policy
-- 6. Sample Record: should show actual data
-- 7. Key History Table: should return TRUE after running SAFE_MIGRATION.sql

