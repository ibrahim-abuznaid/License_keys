import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendTrialKeyEmail, sendCustomEmail } from '@/lib/email-service';
import { KEY_HISTORY_TABLE, LICENSE_KEYS_TABLE } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const keyValue = params.id;
    const body = await request.json().catch(() => ({}));
    const { subject, htmlBody } = body;

    // Get license key
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

    let result;
    
    // If custom subject and body are provided, use them
    if (subject && htmlBody) {
      result = await sendCustomEmail({
        to: licenseKey.email,
        subject,
        htmlBody,
      });
    } else {
      // Otherwise, send the default trial key email
      result = await sendTrialKeyEmail({
        to: licenseKey.email,
        licenseKey,
      });
    }

    if (!result.success) {
      throw new Error('Failed to send email');
    }

    // Log action to history
    await supabaseAdmin.from(KEY_HISTORY_TABLE).insert({
      key_value: keyValue,
      action: 'email_sent',
      details: { email_type: subject && htmlBody ? 'custom' : 'trial' },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
