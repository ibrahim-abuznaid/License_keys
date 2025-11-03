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

