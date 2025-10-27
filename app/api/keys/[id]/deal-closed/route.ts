import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateLicenseKey } from '@/lib/key-generator';
import { sendDealClosedEmail } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { active_flows_limit } = await request.json();
    const trialKeyId = params.id;

    if (!active_flows_limit || active_flows_limit <= 0) {
      return NextResponse.json(
        { error: 'Invalid active_flows_limit value' },
        { status: 400 }
      );
    }

    // Get current trial key
    const { data: trialKey, error: fetchError } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('id', trialKeyId)
      .single();

    if (fetchError || !trialKey) {
      return NextResponse.json(
        { error: 'License key not found' },
        { status: 404 }
      );
    }

    // Update trial key to development key (remove expiry, add limits)
    const { data: developmentKey, error: devUpdateError } = await supabaseAdmin
      .from('license_keys')
      .update({
        key_type: 'development',
        expires_at: null,
        active_flows_limit,
      })
      .eq('id', trialKeyId)
      .select()
      .single();

    if (devUpdateError) {
      throw devUpdateError;
    }

    // Generate new production key
    const productionKeyValue = generateLicenseKey();

    const { data: productionKey, error: prodInsertError } = await supabaseAdmin
      .from('license_keys')
      .insert({
        key: productionKeyValue,
        customer_email: trialKey.customer_email,
        deployment: trialKey.deployment,
        features: trialKey.features,
        key_type: 'production',
        status: 'active',
        active_flows_limit,
        expires_at: null,
      })
      .select()
      .single();

    if (prodInsertError) {
      throw prodInsertError;
    }

    // Log actions to history
    await supabaseAdmin.from('key_history').insert([
      {
        key_id: trialKeyId,
        action: 'deal_closed',
        details: { 
          converted_to: 'development', 
          active_flows_limit,
          production_key_id: productionKey.id 
        },
      },
      {
        key_id: productionKey.id,
        action: 'created',
        details: { 
          type: 'production', 
          active_flows_limit,
          related_dev_key_id: trialKeyId 
        },
      },
    ]);

    // Send welcome email with both keys
    await sendDealClosedEmail({
      to: trialKey.customer_email,
      developmentKey,
      productionKey,
      activeFlowsLimit: active_flows_limit,
    });

    return NextResponse.json({ 
      data: { 
        developmentKey, 
        productionKey 
      } 
    });
  } catch (error: any) {
    console.error('Error closing deal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to close deal' },
      { status: 500 }
    );
  }
}

