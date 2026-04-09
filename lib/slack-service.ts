import { LicenseKey, NotificationTemplate } from './types';
import { supabaseAdmin } from './supabase';
import { KEY_HISTORY_TABLE, NOTIFICATION_TEMPLATES_TABLE, SUBSCRIBER_SETTINGS_TABLE } from './config';

const slackWebhookUrl =
  process.env.SLACK_WEBHOOK_URL ||
  'https://cloud.activepieces.com/api/v1/webhooks/zmZ8svwRSEivvYK6XHhrR';

function resolveTemplate(template: string, key: LicenseKey): string {
  const expiresAtFormatted = key.expiresAt
    ? new Date(key.expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Never';

  let daysRemaining = 'N/A';
  if (key.expiresAt) {
    const now = new Date();
    const expires = new Date(key.expiresAt);
    const diff = Math.ceil(
      (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    daysRemaining = diff.toString();
  }

  return template
    .replace(/\{\{fullName\}\}/g, key.fullName || 'N/A')
    .replace(/\{\{email\}\}/g, key.email)
    .replace(/\{\{companyName\}\}/g, key.companyName || 'N/A')
    .replace(/\{\{expiresAt\}\}/g, expiresAtFormatted)
    .replace(/\{\{daysRemaining\}\}/g, daysRemaining)
    .replace(/\{\{licenseKey\}\}/g, key.key);
}

export async function getTemplate(
  templateId: string,
): Promise<NotificationTemplate | null> {
  const { data, error } = await supabaseAdmin
    .from(NOTIFICATION_TEMPLATES_TABLE)
    .select('*')
    .eq('id', templateId)
    .single();

  if (error || !data) return null;
  return data as NotificationTemplate;
}

export async function getSlackChannelId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from(SUBSCRIBER_SETTINGS_TABLE)
    .select('slackChannelId')
    .eq('email', email)
    .single();

  return data?.slackChannelId ?? null;
}

interface SendSlackNotificationParams {
  licenseKey: LicenseKey;
  templateId: string;
}

export async function sendSlackNotification({
  licenseKey,
  templateId,
}: SendSlackNotificationParams): Promise<{ success: boolean; error?: unknown }> {
  try {
    const template = await getTemplate(templateId);
    if (!template) {
      console.error(`Slack notification template "${templateId}" not found`);
      return { success: false, error: 'Template not found' };
    }

    if (!template.enabled) {
      console.log(`Slack notification template "${templateId}" is disabled, skipping`);
      return { success: true };
    }

    const message = resolveTemplate(template.message, licenseKey);
    const slackChannelId = await getSlackChannelId(licenseKey.email);

    const payload: Record<string, string> = {
      message,
      email: licenseKey.email,
    };

    if (slackChannelId) {
      payload.slackChannelId = slackChannelId;
    }

    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook request failed: ${response.statusText}`);
    }

    await supabaseAdmin.from(KEY_HISTORY_TABLE).insert({
      key_value: licenseKey.key,
      action: 'slack_notification_sent',
      performed_by: 'system',
      details: { templateId },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return { success: false, error };
  }
}

export async function hasNotificationBeenSent(
  keyValue: string,
  templateId: string,
): Promise<boolean> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data } = await supabaseAdmin
    .from(KEY_HISTORY_TABLE)
    .select('id')
    .eq('key_value', keyValue)
    .eq('action', 'slack_notification_sent')
    .gte('performed_at', todayStart.toISOString())
    .contains('details', { templateId })
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export async function sendActionNotifications(
  licenseKey: LicenseKey,
  action: string,
): Promise<void> {
  try {
    const { data: templates } = await supabaseAdmin
      .from(NOTIFICATION_TEMPLATES_TABLE)
      .select('*')
      .eq('trigger_type', 'action')
      .eq('trigger_action', action)
      .eq('enabled', true);

    for (const template of templates || []) {
      await sendSlackNotification({ licenseKey, templateId: template.id });
    }
  } catch (error) {
    console.error(`Failed to send action notifications for "${action}":`, error);
  }
}
