-- Create enum types
CREATE TYPE deployment_type AS ENUM ('cloud', 'self-hosted');
CREATE TYPE key_status AS ENUM ('active', 'disabled', 'expired');
CREATE TYPE key_type AS ENUM ('trial', 'development', 'production');

-- Create license_keys table
CREATE TABLE license_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    customer_email TEXT NOT NULL,
    deployment deployment_type NOT NULL,
    key_type key_type DEFAULT 'trial' NOT NULL,
    status key_status DEFAULT 'active' NOT NULL,
    
    -- Features (stored as JSONB for flexibility)
    features JSONB NOT NULL DEFAULT '{}',
    
    -- Dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Limits (for closed deals)
    active_flows_limit INTEGER,
    
    -- Metadata
    notes TEXT,
    created_by TEXT,
    
    -- Indexes
    CONSTRAINT valid_email CHECK (customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for better query performance
CREATE INDEX idx_license_keys_email ON license_keys(customer_email);
CREATE INDEX idx_license_keys_status ON license_keys(status);
CREATE INDEX idx_license_keys_created_at ON license_keys(created_at DESC);
CREATE INDEX idx_license_keys_expires_at ON license_keys(expires_at);

-- Create key_history table to track actions
CREATE TABLE key_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id UUID NOT NULL REFERENCES license_keys(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    details JSONB
);

CREATE INDEX idx_key_history_key_id ON key_history(key_id);
CREATE INDEX idx_key_history_performed_at ON key_history(performed_at DESC);

-- Create function to automatically update status based on expiry
CREATE OR REPLACE FUNCTION update_expired_keys()
RETURNS void AS $$
BEGIN
    UPDATE license_keys
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_history ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
-- For now, we'll allow all operations with service role key
CREATE POLICY "Enable all access for service role" ON license_keys
    FOR ALL USING (true);

CREATE POLICY "Enable all access for service role on history" ON key_history
    FOR ALL USING (true);

