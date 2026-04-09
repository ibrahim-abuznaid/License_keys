import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { LICENSE_KEYS_TABLE, NOTIFICATION_TEMPLATES_TABLE, CRON_RUN_LOGS_TABLE } from '@/lib/config';
import { LicenseKey, NotificationTemplate } from '@/lib/types';
import { sendSlackNotification, hasNotificationBeenSent } from '@/lib/slack-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const providedKey = authHeader.slice(7);
  const expectedKey = process.env.API_SECRET_KEY;

  if (!expectedKey) {
    console.error('API_SECRET_KEY is not configured');
    return false;
  }

  return providedKey === expectedKey;
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid Bearer token.' },
      { status: 401 },
    );
  }

  const startTime = Date.now();

  try {
    const { data: scheduleTemplates, error: tplError } = await supabaseAdmin
      .from(NOTIFICATION_TEMPLATES_TABLE)
      .select('*')
      .eq('trigger_type', 'schedule')
      .eq('enabled', true);

    if (tplError) throw tplError;

    const scheduleCount = scheduleTemplates?.length ?? 0;

    if (!scheduleTemplates || scheduleTemplates.length === 0) {
      await supabaseAdmin.from(CRON_RUN_LOGS_TABLE).insert({
        trial_keys_processed: 0,
        notifications_sent: 0,
        schedule_templates_count: 0,
        results: [],
        duration_ms: Date.now() - startTime,
      });
      return NextResponse.json({ message: 'No schedule-based templates enabled', sent: 0 });
    }

    const templatesByDays = new Map<number, NotificationTemplate[]>();
    for (const tpl of scheduleTemplates as NotificationTemplate[]) {
      if (tpl.trigger_days === null) continue;
      const daysDiff = -(tpl.trigger_days);
      const existing = templatesByDays.get(daysDiff) || [];
      existing.push(tpl);
      templatesByDays.set(daysDiff, existing);
    }

    const { data: trialKeys, error } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .select('*')
      .eq('isTrial', true)
      .not('expiresAt', 'is', null);

    if (error) throw error;

    const keyCount = trialKeys?.length ?? 0;

    if (!trialKeys || trialKeys.length === 0) {
      await supabaseAdmin.from(CRON_RUN_LOGS_TABLE).insert({
        trial_keys_processed: 0,
        notifications_sent: 0,
        schedule_templates_count: scheduleCount,
        results: [],
        duration_ms: Date.now() - startTime,
      });
      return NextResponse.json({ message: 'No trial keys found', sent: 0 });
    }

    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    let sent = 0;
    const results: Array<{ key: string; email: string; templateId: string; success: boolean }> = [];

    for (const key of trialKeys as LicenseKey[]) {
      if (!key.expiresAt) continue;

      const expiresAt = new Date(key.expiresAt);
      const expireDate = new Date(
        Date.UTC(expiresAt.getUTCFullYear(), expiresAt.getUTCMonth(), expiresAt.getUTCDate()),
      );
      const daysDiff = Math.round(
        (expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      const matchingTemplates = templatesByDays.get(daysDiff);
      if (!matchingTemplates) continue;

      for (const template of matchingTemplates) {
        const alreadySent = await hasNotificationBeenSent(key.key, template.id);
        if (alreadySent) continue;

        const result = await sendSlackNotification({ licenseKey: key, templateId: template.id });
        results.push({ key: key.key, email: key.email, templateId: template.id, success: result.success });
        if (result.success) sent++;
      }
    }

    await supabaseAdmin.from(CRON_RUN_LOGS_TABLE).insert({
      trial_keys_processed: keyCount,
      notifications_sent: sent,
      schedule_templates_count: scheduleCount,
      results,
      duration_ms: Date.now() - startTime,
    });

    return NextResponse.json({
      message: `Processed ${keyCount} trial keys against ${scheduleCount} schedule templates`,
      sent,
      results,
    });
  } catch (error: any) {
    console.error('Cron check-trials error:', error);

    try {
      await supabaseAdmin.from(CRON_RUN_LOGS_TABLE).insert({
        trial_keys_processed: 0,
        notifications_sent: 0,
        schedule_templates_count: 0,
        results: [],
        error: error.message || 'Unknown error',
        duration_ms: Date.now() - startTime,
      });
    } catch { /* don't mask the original error */ }

    return NextResponse.json(
      { error: error.message || 'Failed to check trials' },
      { status: 500 },
    );
  }
}
