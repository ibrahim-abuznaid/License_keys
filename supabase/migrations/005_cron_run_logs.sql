CREATE TABLE IF NOT EXISTS public.cron_run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_keys_processed INTEGER NOT NULL DEFAULT 0,
  notifications_sent INTEGER NOT NULL DEFAULT 0,
  schedule_templates_count INTEGER NOT NULL DEFAULT 0,
  results JSONB DEFAULT '[]'::jsonb,
  error TEXT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.cron_run_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for service role on cron_run_logs" ON public.cron_run_logs
    FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_cron_run_logs_ran_at ON cron_run_logs(ran_at DESC);
