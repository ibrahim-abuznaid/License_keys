import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { KEY_HISTORY_TABLE, LICENSE_KEYS_TABLE } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { additional_days } = await request.json();
    const keyValue = params.id;

    if (!additional_days || additional_days <= 0) {
      return NextResponse.json(
        { error: 'Invalid additional_days value' },
        { status: 400 }
      );
    }

    // Get current key
    const { data: currentKey, error: fetchError } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .select('*')
      .eq('key', keyValue)
      .single();

    if (fetchError || !currentKey) {
      return NextResponse.json(
        { error: 'License key not found' },
        { status: 404 }
      );
    }

    // Calculate new expiry date
    const currentExpiry = currentKey.expiresAt 
      ? new Date(currentKey.expiresAt)
      : new Date();
    
    // If current expiry is in the past, start from today
    const now = new Date();
    if (currentExpiry < now) {
      currentExpiry.setTime(now.getTime());
    }
    
    currentExpiry.setDate(currentExpiry.getDate() + additional_days);

    // Update key
    const { data, error } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .update({ 
        expiresAt: currentExpiry.toISOString(),
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
      action: 'extended',
      details: { additional_days, new_expiry: currentExpiry.toISOString() },
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error extending license key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extend license key' },
      { status: 500 }
    );
  }
}
