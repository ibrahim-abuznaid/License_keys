import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      customer_email,
      deployment,
      key_type,
      status,
      features,
      expires_at,
      active_flows_limit,
      notes,
    } = body;

    // Validate required fields
    if (!customer_email || !deployment || !key_type || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert features array to object if it's an array
    const featuresObj = Array.isArray(features)
      ? features.reduce((acc, feature) => {
          acc[feature] = true;
          return acc;
        }, {} as Record<string, boolean>)
      : features;

    // Update the key
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .update({
        customer_email,
        deployment,
        key_type,
        status,
        features: featuresObj,
        expires_at: expires_at || null,
        active_flows_limit: active_flows_limit || null,
        notes: notes || null,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabaseAdmin.from('key_history').insert({
      key_id: params.id,
      action: 'updated',
      details: { updated_fields: body },
    });

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error updating license key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update license key' },
      { status: 500 }
    );
  }
}

