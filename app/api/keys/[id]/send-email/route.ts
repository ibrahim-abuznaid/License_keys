import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendTrialKeyEmail } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const keyId = params.id;

    // Get license key
    const { data: licenseKey, error: fetchError } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('id', keyId)
      .single();

    if (fetchError || !licenseKey) {
      return NextResponse.json(
        { error: 'License key not found' },
        { status: 404 }
      );
    }

    // Send email
    const result = await sendTrialKeyEmail({
      to: licenseKey.customer_email,
      licenseKey,
    });

    if (!result.success) {
      throw new Error('Failed to send email');
    }

    // Log action to history
    await supabaseAdmin.from('key_history').insert({
      key_id: keyId,
      action: 'email_sent',
      details: { email_type: 'trial' },
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

