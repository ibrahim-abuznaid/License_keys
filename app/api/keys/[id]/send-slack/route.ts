import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { KEY_HISTORY_TABLE, LICENSE_KEYS_TABLE, SUBSCRIBER_SETTINGS_TABLE } from '@/lib/config';

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || '';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const keyValue = params.id;
    const body = await request.json().catch(() => ({}));
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const { data: licenseKey, error: fetchError } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .select('*')
      .eq('key', keyValue)
      .single();

    if (fetchError || !licenseKey) {
      return NextResponse.json(
        { error: 'License key not found' },
        { status: 404 }
      );
    }

    const { data: settings } = await supabaseAdmin
      .from(SUBSCRIBER_SETTINGS_TABLE)
      .select('slackChannelId')
      .eq('email', licenseKey.email)
      .single();

    const payload: Record<string, string> = {
      message,
      email: licenseKey.email,
    };

    if (settings?.slackChannelId) {
      payload.slackChannelId = settings.slackChannelId;
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
      key_value: keyValue,
      action: 'slack_sent',
      details: { manual: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending Slack message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send Slack message' },
      { status: 500 }
    );
  }
}
