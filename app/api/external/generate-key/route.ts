import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateLicenseKey } from '@/lib/key-generator';
import { FEATURE_PRESETS, FeaturePreset, LICENSE_KEY_FEATURES } from '@/lib/types';
import { sendTrialKeyEmail } from '@/lib/email-service';
import { sendActionNotifications } from '@/lib/slack-service';
import { KEY_HISTORY_TABLE, LICENSE_KEYS_TABLE, SUBSCRIBER_SETTINGS_TABLE } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_TRIAL_DAYS = 14;
const VALID_PRESETS: ReadonlySet<string> = new Set<string>(['minimal', 'business', 'enterprise', 'all', 'embed']);

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
  preset?: string;
  slackChannelId?: string;
  valid_days?: number;
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
      preset,
      slackChannelId,
      valid_days,
    } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid customer email is required.' },
        { status: 400 }
      );
    }

    if (preset && !VALID_PRESETS.has(preset)) {
      return NextResponse.json(
        { error: `Invalid preset. Must be one of: ${[...VALID_PRESETS].join(', ')}` },
        { status: 400 }
      );
    }

    if (valid_days !== undefined && (typeof valid_days !== 'number' || valid_days <= 0)) {
      return NextResponse.json(
        { error: 'valid_days must be a positive number' },
        { status: 400 }
      );
    }

    const licenseKey = generateLicenseKey();

    const trialDays = valid_days ?? DEFAULT_TRIAL_DAYS;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + trialDays);
    const expiresAt = expiryDate.toISOString();

    let featureSettings: Record<string, boolean>;
    const usedPreset = preset as FeaturePreset | undefined;

    if (usedPreset && FEATURE_PRESETS[usedPreset]) {
      featureSettings = { ...FEATURE_PRESETS[usedPreset] } as Record<string, boolean>;
    } else {
      featureSettings = Object.fromEntries(
        LICENSE_KEY_FEATURES.map((f) => [f, true])
      );
      featureSettings.customDomainsEnabled = false;
    }

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
        ...featureSettings,
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
        valid_days: trialDays,
        preset: usedPreset || 'all',
        isTrial: true,
        keyType: 'development',
        source: 'external-api',
      },
    });

    if (slackChannelId && data) {
      await supabaseAdmin
        .from(SUBSCRIBER_SETTINGS_TABLE)
        .upsert(
          { email: data.email, slackChannelId, updated_at: new Date().toISOString() },
          { onConflict: 'email' },
        );
    }

    if (sendEmail && data) {
      try {
        await sendTrialKeyEmail({ to: data.email, licenseKey: data });
      } catch (emailError) {
        console.error('Failed to send trial email (key was still created):', emailError);
      }
    }

    if (data) {
      sendActionNotifications(data, 'key_created').catch(() => {});
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
        preset: usedPreset || 'all',
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
