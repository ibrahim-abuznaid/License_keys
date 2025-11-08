import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { KEY_HISTORY_TABLE, LICENSE_KEYS_TABLE } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const keyValue = params.id;
    const body = await request.json().catch(() => ({}));
    const { days } = body; // Accept optional days parameter

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

    // Validate days parameter if provided
    if (days !== undefined && days !== null) {
      if (typeof days !== 'number' || days <= 0) {
        return NextResponse.json(
          { error: 'Days must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Determine new expiresAt based on key type
    let newExpiresAt: string | null;
    let daysToExtend: number;
    
    if (currentKey.isTrial) {
      // For trial keys, use provided days or default to 7
      daysToExtend = days || 7;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysToExtend);
      newExpiresAt = expiryDate.toISOString();
    } else {
      // For subscribed keys (development/production), set to null (no expiry)
      newExpiresAt = null;
      daysToExtend = 0; // Not applicable for subscribed keys
    }

    // Update key to reactivate
    const { data, error } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .update({ 
        expiresAt: newExpiresAt,
        activatedAt: new Date().toISOString(), // Update activation time when key is reactivated
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
      action: 'reactivated',
      details: { 
        new_expiry: newExpiresAt,
        key_type: currentKey.keyType,
        was_trial: currentKey.isTrial,
        days_extended: daysToExtend,
        previous_expiry: currentKey.expiresAt,
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

