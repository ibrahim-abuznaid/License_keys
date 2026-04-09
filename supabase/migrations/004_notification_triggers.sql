-- Add trigger columns to notification_templates
ALTER TABLE public.notification_templates
  ADD COLUMN IF NOT EXISTS trigger_type TEXT NOT NULL DEFAULT 'schedule',
  ADD COLUMN IF NOT EXISTS trigger_action TEXT NULL,
  ADD COLUMN IF NOT EXISTS trigger_days INTEGER NULL;

-- Update existing seeded rows with trigger metadata
UPDATE public.notification_templates SET trigger_type = 'action', trigger_action = 'key_created' WHERE id = 'trial_started';
UPDATE public.notification_templates SET trigger_type = 'schedule', trigger_days = -7 WHERE id = 'trial_expiring_7d';
UPDATE public.notification_templates SET trigger_type = 'schedule', trigger_days = -3 WHERE id = 'trial_expiring_3d';
UPDATE public.notification_templates SET trigger_type = 'schedule', trigger_days = 0 WHERE id = 'trial_expired';
UPDATE public.notification_templates SET trigger_type = 'schedule', trigger_days = 2 WHERE id = 'trial_extend_offer';
