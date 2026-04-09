import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { NOTIFICATION_TEMPLATES_TABLE } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from(NOTIFICATION_TEMPLATES_TABLE)
      .select('*')
      .order('id');

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching notification templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notification templates' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, message, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof message === 'string') updates.message = message;
    if (typeof enabled === 'boolean') updates.enabled = enabled;

    const { data, error } = await supabaseAdmin
      .from(NOTIFICATION_TEMPLATES_TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error updating notification template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notification template' },
      { status: 500 },
    );
  }
}
