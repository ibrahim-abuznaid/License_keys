import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const keyValue = params.id;

    // Set expiresAt to today to disable the key
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day

    // Update key to disabled (expiresAt = today)
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .update({ 
        expiresAt: today.toISOString()
      })
      .eq('key', keyValue)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log action to history
    await supabaseAdmin.from('key_history').insert({
      key_value: keyValue,
      action: 'disabled',
      details: { disabled_at: today.toISOString() },
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error disabling license key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disable license key' },
      { status: 500 }
    );
  }
}
