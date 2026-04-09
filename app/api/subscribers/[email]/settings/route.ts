import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { SUBSCRIBER_SETTINGS_TABLE } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: NextRequest,
  { params }: { params: { email: string } },
) {
  try {
    const email = decodeURIComponent(params.email);

    const { data, error } = await supabaseAdmin
      .from(SUBSCRIBER_SETTINGS_TABLE)
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({
      data: data || { email, slackChannelId: null },
    });
  } catch (error: any) {
    console.error('Error fetching subscriber settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriber settings' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { email: string } },
) {
  try {
    const email = decodeURIComponent(params.email);
    const body = await request.json();
    const { slackChannelId } = body;

    const { data, error } = await supabaseAdmin
      .from(SUBSCRIBER_SETTINGS_TABLE)
      .upsert(
        {
          email,
          slackChannelId: slackChannelId || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error updating subscriber settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subscriber settings' },
      { status: 500 },
    );
  }
}
