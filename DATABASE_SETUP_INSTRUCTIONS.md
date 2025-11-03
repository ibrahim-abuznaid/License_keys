# Database Setup Instructions

## Overview

This guide will help you set up the new database schema for the License Key Management System on Supabase.

## Key Changes in the New Schema

### Database Structure Changes

1. **Primary Key Change**: The `key` column is now the primary key (instead of a separate `id` column)
2. **Column Naming**: Using camelCase for column names (e.g., `createdAt`, `expiresAt`)
3. **Removed Columns**: 
   - `deployment` (cloud/self-hosted)
   - `status` enum
4. **New Columns**: Many feature flags and additional metadata fields

### Business Logic Changes

- **Trial Keys**: Have an `expiresAt` date set in the future and `isTrial` = true
- **Subscribed Keys**: Have `expiresAt` = NULL (no expiry), `isTrial` = false
- **Disabled Keys**: Have `expiresAt` set to today or a past date
- **Status Determination**: Status (active/expired/disabled) is computed from `expiresAt` value, not stored

## Setup Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Log in to Supabase**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign in and select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the contents of `supabase/migrations/002_new_schema.sql`
   - Paste it into the SQL editor
   - Click "Run" or press `Ctrl/Cmd + Enter`

4. **Verify the Setup**
   - Click on "Table Editor" in the left sidebar
   - You should see the new `license_keys` table with all columns
   - Click on "Database" → "Tables" to see the structure

### Option 2: Using Supabase CLI

1. **Install Supabase CLI** (if not already installed)
```bash
npm install -g supabase
```

2. **Login to Supabase**
```bash
supabase login
```

3. **Link Your Project**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. **Run the Migration**
```bash
supabase db push
```

### Option 3: Manual SQL Execution

If you prefer to run the migration manually, here's the SQL:

```sql
-- Drop old tables and types
DROP TABLE IF EXISTS key_history CASCADE;
DROP TABLE IF EXISTS license_keys CASCADE;
DROP TYPE IF EXISTS deployment_type CASCADE;
DROP TYPE IF EXISTS key_status CASCADE;
DROP TYPE IF EXISTS key_type CASCADE;
DROP FUNCTION IF EXISTS update_expired_keys();

-- Create new enum type for LicenseKeyType
CREATE TYPE LicenseKeyType AS ENUM ('trial', 'development', 'production');

-- Create the new license_keys table
CREATE TABLE public.license_keys (
  key TEXT NOT NULL,
  email TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMP WITH TIME ZONE NULL,
  "activatedAt" TIMESTAMP WITH TIME ZONE NULL,
  "ssoEnabled" BOOLEAN NULL DEFAULT TRUE,
  "gitSyncEnabled" BOOLEAN NULL DEFAULT TRUE,
  "showPoweredBy" BOOLEAN NULL DEFAULT TRUE,
  "embeddingEnabled" BOOLEAN NULL DEFAULT FALSE,
  "auditLogEnabled" BOOLEAN NULL DEFAULT TRUE,
  "customAppearanceEnabled" BOOLEAN NULL DEFAULT TRUE,
  "manageProjectsEnabled" BOOLEAN NULL DEFAULT TRUE,
  "managePiecesEnabled" BOOLEAN NULL DEFAULT TRUE,
  "manageTemplatesEnabled" BOOLEAN NULL DEFAULT TRUE,
  "apiKeysEnabled" BOOLEAN NULL DEFAULT TRUE,
  "customDomainsEnabled" BOOLEAN NULL DEFAULT TRUE,
  "projectRolesEnabled" BOOLEAN NULL DEFAULT TRUE,
  "flowIssuesEnabled" BOOLEAN NULL DEFAULT TRUE,
  "alertsEnabled" BOOLEAN NULL DEFAULT TRUE,
  "premiumPieces" TEXT[] NULL DEFAULT '{}'::TEXT[],
  "companyName" TEXT NULL,
  goal TEXT NULL,
  "analyticsEnabled" BOOLEAN NULL DEFAULT TRUE,
  "globalConnectionsEnabled" BOOLEAN NULL DEFAULT TRUE,
  "customRolesEnabled" BOOLEAN NULL DEFAULT TRUE,
  "environmentsEnabled" BOOLEAN NULL DEFAULT FALSE,
  notes TEXT NULL,
  "keyType" LicenseKeyType NOT NULL DEFAULT 'production'::LicenseKeyType,
  "isTrial" BOOLEAN NULL,
  "fullName" TEXT NULL,
  "numberOfEmployees" TEXT NULL,
  "agentsEnabled" BOOLEAN NULL DEFAULT FALSE,
  "tablesEnabled" BOOLEAN NULL DEFAULT FALSE,
  "todosEnabled" BOOLEAN NULL DEFAULT TRUE,
  "mcpsEnabled" BOOLEAN NULL DEFAULT FALSE,
  "activeFlows" INTEGER NULL,
  CONSTRAINT license_keys_pkey PRIMARY KEY (key)
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX idx_license_keys_email ON license_keys(email);
CREATE INDEX idx_license_keys_created_at ON license_keys("createdAt" DESC);
CREATE INDEX idx_license_keys_expires_at ON license_keys("expiresAt");
CREATE INDEX idx_license_keys_key_type ON license_keys("keyType");

-- Create key_history table to track actions
CREATE TABLE key_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_value TEXT NOT NULL REFERENCES license_keys(key) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    details JSONB
);

CREATE INDEX idx_key_history_key_value ON key_history(key_value);
CREATE INDEX idx_key_history_performed_at ON key_history(performed_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_history ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations with service role key)
CREATE POLICY "Enable all access for service role" ON license_keys
    FOR ALL USING (true);

CREATE POLICY "Enable all access for service role on history" ON key_history
    FOR ALL USING (true);
```

## Verification Steps

After running the migration, verify the setup:

1. **Check Tables Exist**
   - `license_keys` table should exist with all columns
   - `key_history` table should exist

2. **Check Indexes**
   - Run: `SELECT * FROM pg_indexes WHERE tablename = 'license_keys';`
   - You should see 4 indexes

3. **Check Enum Type**
   - Run: `SELECT enum_range(NULL::LicenseKeyType);`
   - Should return: `{trial,development,production}`

4. **Test Creating a Key**
   - Try creating a trial key from the application
   - Verify it appears in the database correctly

## Important Notes

### Data Migration

⚠️ **This migration drops existing tables!** If you have existing data, you'll need to:

1. **Export existing data** before running the migration
2. **Transform the data** to match the new schema:
   - Map `customer_email` → `email`
   - Map `created_at` → `createdAt`
   - Map `expires_at` → `expiresAt`
   - Map feature JSONB to individual boolean columns
   - Set appropriate defaults for new columns
3. **Import the transformed data** after migration

### Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Feature Flags

The new schema includes 22 feature flag columns. Default values are:

- **Enabled by default**: Most features (SSO, Git Sync, Audit Logs, etc.)
- **Disabled by default**: Embedding, Environments, Agents, Tables, MCPs
- **Always enabled**: Todos, Show Powered By

You can customize these defaults in the `FEATURE_PRESETS` in `lib/types.ts`.

## Testing the Application

After setup, test these workflows:

1. **Create a Trial Key**
   - Generate a 14-day trial key
   - Verify `expiresAt` is set to 14 days from now
   - Verify `isTrial` is true

2. **Close a Deal**
   - Click "Close Deal" on a trial key
   - Verify `expiresAt` becomes NULL
   - Verify `isTrial` becomes false
   - Verify `keyType` becomes 'production'

3. **Disable a Key**
   - Click "Disable" on any key
   - Verify `expiresAt` is set to today
   - Verify status badge shows "DISABLED"

4. **Edit Feature Flags**
   - Click "Edit" on any key
   - Toggle various feature flags
   - Save and verify changes persist

## Troubleshooting

### Migration Fails

- **Error**: "relation already exists"
  - The migration includes `DROP TABLE IF EXISTS` so this shouldn't happen
  - Try dropping tables manually first

- **Error**: "permission denied"
  - Make sure you're using the service role key
  - Check RLS policies are set correctly

### Application Not Connecting

- **Check environment variables** are set correctly
- **Verify Supabase project** is running
- **Check API keys** haven't expired

### Keys Not Showing

- **Check table name** is `license_keys` (lowercase with underscore)
- **Verify column names** use camelCase (e.g., `createdAt`, not `created_at`)
- **Check browser console** for API errors

## Support

If you encounter issues:

1. Check the Supabase logs in the Dashboard
2. Review the browser console for errors
3. Verify the migration ran successfully
4. Check that all environment variables are set

## Next Steps

After successful setup:

1. ✅ Test creating trial keys
2. ✅ Test closing deals
3. ✅ Test disabling keys
4. ✅ Test editing feature flags
5. ✅ Set up email integration (if not already done)
6. ✅ Configure any custom feature presets
7. ✅ Train team on new status logic (NULL = subscribed, today = disabled)

