import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SUBSCRIBER_SETTINGS_TABLE } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid Bearer token in the Authorization header.' },
      { status: 401 },
    );
  }

  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email query parameter is required.' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from(SUBSCRIBER_SETTINGS_TABLE)
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({
      success: true,
      data: data || { email, slackChannelId: null },
    });
  } catch (error: any) {
    console.error('External API - Error fetching subscriber settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriber settings' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid Bearer token in the Authorization header.' },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { email, slackChannelId } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email is required.' },
        { status: 400 },
      );
    }

    if (slackChannelId === undefined) {
      return NextResponse.json(
        { error: 'slackChannelId is required.' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from(SUBSCRIBER_SETTINGS_TABLE)
      .upsert(
        {
          email: email.trim().toLowerCase(),
          slackChannelId: slackChannelId || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { email: data.email, slackChannelId: data.slackChannelId },
    });
  } catch (error: any) {
    console.error('External API - Error updating subscriber settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subscriber settings' },
      { status: 500 },
    );
  }
}
