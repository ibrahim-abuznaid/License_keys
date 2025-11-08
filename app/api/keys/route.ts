import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateLicenseKey } from '@/lib/key-generator';
import { CreateLicenseKeyInput, FEATURE_PRESETS, LICENSE_KEY_FEATURES, LicenseKeyFeature } from '@/lib/types';
import { sendTrialKeyEmail } from '@/lib/email-service';
import { KEY_HISTORY_TABLE, LICENSE_KEYS_TABLE } from '@/lib/config';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all license keys with optional search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .select('*')
      .order('createdAt', { ascending: false });

    if (search) {
      query = query.ilike('email', `%${search}%`);
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
    const { 
      email, 
      valid_days, 
      fullName, 
      companyName, 
      numberOfEmployees, 
      goal, 
      notes, 
      preset = 'business',
      activeFlows 
    } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate license key
    const licenseKey = generateLicenseKey();

    // Calculate expiry date (null if subscribed, otherwise set expiry)
    let expiresAt: string | null = null;
    let isTrial = false;
    let keyType: 'development' | 'production' = 'production';

    if (valid_days !== null && valid_days !== undefined) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + valid_days);
      expiresAt = expiryDate.toISOString();
      isTrial = true;
      keyType = 'development'; // Trial keys are created as development type
    }

    // Get feature preset and merge any overrides from the request
    const baseFeatureSettings = FEATURE_PRESETS[preset] || FEATURE_PRESETS.business;
    const featureOverrides: Partial<Record<LicenseKeyFeature, boolean>> = {};

    for (const featureKey of LICENSE_KEY_FEATURES) {
      const overrideValue = body[featureKey];
      if (typeof overrideValue === 'boolean') {
        featureOverrides[featureKey] = overrideValue;
      }
    }

    const featureSettings = {
      ...baseFeatureSettings,
      ...featureOverrides,
    };

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .insert({
        key: licenseKey,
        email,
        expiresAt,
        activatedAt: new Date().toISOString(), // Set activation time when key is created
        isTrial,
        keyType,
        fullName,
        companyName,
        numberOfEmployees,
        goal,
        notes,
        activeFlows,
        ...featureSettings,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log action to history
    await supabaseAdmin.from(KEY_HISTORY_TABLE).insert({
      key_value: licenseKey,
      action: 'created',
      details: { 
        valid_days, 
        preset,
        isTrial,
        keyType 
      },
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
