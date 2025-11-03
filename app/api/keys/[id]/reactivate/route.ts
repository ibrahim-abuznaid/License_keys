import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const keyValue = params.id;

    // Get current key
    const { data: currentKey, error: fetchError } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('key', keyValue)
      .single();

    if (fetchError || !currentKey) {
      return NextResponse.json(
        { error: 'License key not found' },
        { status: 404 }
      );
    }

    // Determine new expiresAt based on key type
    let newExpiresAt: string | null;
    
    if (currentKey.isTrial) {
      // For trial keys, extend by 7 days from today
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      newExpiresAt = expiryDate.toISOString();
    } else {
      // For subscribed keys (development/production), set to null (no expiry)
      newExpiresAt = null;
    }

    // Update key to reactivate
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .update({ 
        expiresAt: newExpiresAt,
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
      action: 'reactivated',
      details: { 
        new_expiry: newExpiresAt,
        key_type: currentKey.keyType,
        was_trial: currentKey.isTrial,
      },
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error reactivating license key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reactivate license key' },
      { status: 500 }
    );
  }
}

