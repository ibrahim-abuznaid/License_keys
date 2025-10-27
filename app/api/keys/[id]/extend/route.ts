import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { additional_days } = await request.json();
    const keyId = params.id;

    if (!additional_days || additional_days <= 0) {
      return NextResponse.json(
        { error: 'Invalid additional_days value' },
        { status: 400 }
      );
    }

    // Get current key
    const { data: currentKey, error: fetchError } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('id', keyId)
      .single();

    if (fetchError || !currentKey) {
      return NextResponse.json(
        { error: 'License key not found' },
        { status: 404 }
      );
    }

    // Calculate new expiry date
    const currentExpiry = currentKey.expires_at 
      ? new Date(currentKey.expires_at)
      : new Date();
    
    currentExpiry.setDate(currentExpiry.getDate() + additional_days);

    // Update key
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .update({ 
        expires_at: currentExpiry.toISOString(),
        status: 'active', // Reactivate if expired
      })
      .eq('id', keyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log action to history
    await supabaseAdmin.from('key_history').insert({
      key_id: keyId,
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

