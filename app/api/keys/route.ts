import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateLicenseKey } from '@/lib/key-generator';
import { CreateLicenseKeyInput } from '@/lib/types';
import { sendTrialKeyEmail } from '@/lib/email-service';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all license keys with optional search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('license_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('customer_email', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching license keys:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch license keys' },
      { status: 500 }
    );
  }
}

// POST create new license key
export async function POST(request: NextRequest) {
  try {
    const body: CreateLicenseKeyInput = await request.json();
    const { customer_email, deployment, features, valid_days } = body;

    // Validate input
    if (!customer_email || !deployment || !features || valid_days === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate license key
    const licenseKey = generateLicenseKey();

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + valid_days);

    // Convert features array to object
    const featuresObj = features.reduce((acc, feature) => {
      acc[feature] = true;
      return acc;
    }, {} as Record<string, boolean>);

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .insert({
        key: licenseKey,
        customer_email,
        deployment,
        features: featuresObj,
        expires_at: expiresAt.toISOString(),
        key_type: 'trial',
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log action to history
    await supabaseAdmin.from('key_history').insert({
      key_id: data.id,
      action: 'created',
      details: { valid_days, features },
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error creating license key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create license key' },
      { status: 500 }
    );
  }
}

