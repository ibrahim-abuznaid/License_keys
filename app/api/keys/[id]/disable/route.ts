import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const keyId = params.id;

    // Update key status to disabled
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .update({ status: 'disabled' })
      .eq('id', keyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log action to history
    await supabaseAdmin.from('key_history').insert({
      key_id: keyId,
      action: 'disabled',
      details: {},
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

