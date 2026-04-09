import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { LICENSE_KEYS_TABLE } from '@/lib/config';
import { LicenseKey } from '@/lib/types';
import { sendSlackNotification, hasNotificationBeenSent } from '@/lib/slack-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TEMPLATE_BY_DAYS: Record<number, string> = {
  7: 'trial_expiring_7d',
  3: 'trial_expiring_3d',
  0: 'trial_expired',
  '-2': 'trial_extend_offer',
};

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

  try {
    const { data: trialKeys, error } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .select('*')
      .eq('isTrial', true)
      .not('expiresAt', 'is', null);

    if (error) throw error;
    if (!trialKeys || trialKeys.length === 0) {
      return NextResponse.json({ message: 'No trial keys found', sent: 0 });
    }

    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    let sent = 0;
    const results: Array<{ key: string; templateId: string; success: boolean }> = [];

    for (const key of trialKeys as LicenseKey[]) {
      if (!key.expiresAt) continue;

      const expiresAt = new Date(key.expiresAt);
      const expireDate = new Date(
        Date.UTC(expiresAt.getUTCFullYear(), expiresAt.getUTCMonth(), expiresAt.getUTCDate()),
      );
      const daysDiff = Math.round(
        (expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      for (const [days, templateId] of Object.entries(TEMPLATE_BY_DAYS)) {
        if (daysDiff !== parseInt(days)) continue;

        const alreadySent = await hasNotificationBeenSent(key.key, templateId);
        if (alreadySent) continue;

        const result = await sendSlackNotification({ licenseKey: key, templateId });
        results.push({ key: key.key, templateId, success: result.success });
        if (result.success) sent++;
      }
    }

    return NextResponse.json({
      message: `Processed ${trialKeys.length} trial keys`,
      sent,
      results,
    });
  } catch (error: any) {
    console.error('Cron check-trials error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check trials' },
      { status: 500 },
    );
  }
}
