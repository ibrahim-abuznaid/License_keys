-- Subscriber settings table (keyed by email, separate from license_keys)
CREATE TABLE IF NOT EXISTS public.subscriber_settings (
  email TEXT PRIMARY KEY,
  "slackChannelId" TEXT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriber_settings_email ON subscriber_settings(email);

-- Enable RLS
ALTER TABLE public.subscriber_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for service role on subscriber_settings" ON public.subscriber_settings
    FOR ALL USING (true);

-- Notification templates table for editable Slack message templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  message TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for service role on notification_templates" ON public.notification_templates
    FOR ALL USING (true);

-- Seed default templates
INSERT INTO public.notification_templates (id, label, message, enabled) VALUES
  ('trial_started', 'Trial Started', 'New trial started for {{fullName}} ({{email}}) - Company: {{companyName}}. Expires: {{expiresAt}}', true),
  ('trial_expiring_7d', '7 Days Before Expiry', 'Trial for {{fullName}} ({{email}}) expires in 7 days ({{expiresAt}})', true),
  ('trial_expiring_3d', '3 Days Before Expiry', 'Trial for {{fullName}} ({{email}}) expires in 3 days ({{expiresAt}})', true),
  ('trial_expired', 'Trial Expired', 'Trial for {{fullName}} ({{email}}) has expired today', true),
  ('trial_extend_offer', '2 Days After Expiry', 'Trial for {{fullName}} ({{email}}) expired 2 days ago. Reach out about extending?', true)
ON CONFLICT (id) DO NOTHING;
