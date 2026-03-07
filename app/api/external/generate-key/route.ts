import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateLicenseKey } from '@/lib/key-generator';
import { LICENSE_KEY_FEATURES } from '@/lib/types';
import { sendTrialKeyEmail } from '@/lib/email-service';
import { KEY_HISTORY_TABLE, LICENSE_KEYS_TABLE } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TRIAL_DAYS = 14;

function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const providedKey = authHeader.slice(7);
  const expectedKey = process.env.API_SECRET_KEY;

  if (!expectedKey) {
    console.error('API_SECRET_KEY is not configured in environment variables');
    return false;
  }

  return providedKey === expectedKey;
}

interface ExternalGenerateKeyInput {
  email: string;
  fullName?: string;
  companyName?: string;
  numberOfEmployees?: string;
  activeFlows?: number | null;
  goal?: string;
  notes?: string;
  sendEmail?: boolean;
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid Bearer token in the Authorization header.' },
      { status: 401 }
    );
  }

  try {
    const body: ExternalGenerateKeyInput = await request.json();
    const {
      email,
      fullName,
      companyName,
      numberOfEmployees,
      activeFlows,
      goal,
      notes,
      sendEmail = true,
    } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid customer email is required.' },
        { status: 400 }
      );
    }

    const licenseKey = generateLicenseKey();

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + TRIAL_DAYS);
    const expiresAt = expiryDate.toISOString();

    const allFeaturesEnabled = Object.fromEntries(
      LICENSE_KEY_FEATURES.map((f) => [f, true])
    );
    allFeaturesEnabled.customDomainsEnabled = false;

    const { data, error } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .insert({
        key: licenseKey,
        email: email.trim().toLowerCase(),
        expiresAt,
        activatedAt: new Date().toISOString(),
        isTrial: true,
        keyType: 'development',
        fullName: fullName || null,
        companyName: companyName || null,
        numberOfEmployees: numberOfEmployees || null,
        goal: goal || null,
        notes: notes || null,
        activeFlows: activeFlows ?? null,
        ...allFeaturesEnabled,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await supabaseAdmin.from(KEY_HISTORY_TABLE).insert({
      key_value: licenseKey,
      action: 'created',
      performed_by: 'external-api',
      details: {
        valid_days: TRIAL_DAYS,
        preset: 'all',
        isTrial: true,
        keyType: 'development',
        source: 'external-api',
      },
    });

    if (sendEmail && data) {
      try {
        await sendTrialKeyEmail({ to: data.email, licenseKey: data });
      } catch (emailError) {
        console.error('Failed to send trial email (key was still created):', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        key: data.key,
        email: data.email,
        keyType: data.keyType,
        isTrial: data.isTrial,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt,
        fullName: data.fullName,
        companyName: data.companyName,
        activeFlows: data.activeFlows,
      },
    });
  } catch (error: any) {
    console.error('External API - Error creating license key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create license key' },
      { status: 500 }
    );
  }
}
