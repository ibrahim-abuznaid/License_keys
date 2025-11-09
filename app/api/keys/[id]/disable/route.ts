import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { KEY_HISTORY_TABLE, LICENSE_KEYS_TABLE } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const keyValue = params.id;

    // Set expiresAt to today to disable the key
    const now = new Date();
    // Use UTC to avoid timezone issues
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    // Update key to disabled (expiresAt = today)
    const { data, error } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
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
    await supabaseAdmin.from(KEY_HISTORY_TABLE).insert({
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
