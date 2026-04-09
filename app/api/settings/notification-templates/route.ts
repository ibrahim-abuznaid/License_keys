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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { label, message, trigger_type, trigger_action, trigger_days } = body;

    if (!label || !message || !trigger_type) {
      return NextResponse.json(
        { error: 'label, message, and trigger_type are required' },
        { status: 400 },
      );
    }

    if (trigger_type === 'action' && !trigger_action) {
      return NextResponse.json(
        { error: 'trigger_action is required for action-based notifications' },
        { status: 400 },
      );
    }

    if (trigger_type === 'schedule' && (trigger_days === undefined || trigger_days === null)) {
      return NextResponse.json(
        { error: 'trigger_days is required for schedule-based notifications' },
        { status: 400 },
      );
    }

    const id = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    const { data, error } = await supabaseAdmin
      .from(NOTIFICATION_TEMPLATES_TABLE)
      .insert({
        id,
        label,
        message,
        enabled: true,
        trigger_type,
        trigger_action: trigger_type === 'action' ? trigger_action : null,
        trigger_days: trigger_type === 'schedule' ? trigger_days : null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating notification template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create notification template' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, message, enabled, trigger_type, trigger_action, trigger_days } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof message === 'string') updates.message = message;
    if (typeof enabled === 'boolean') updates.enabled = enabled;
    if (typeof trigger_type === 'string') updates.trigger_type = trigger_type;
    if (trigger_action !== undefined) updates.trigger_action = trigger_action;
    if (trigger_days !== undefined) updates.trigger_days = trigger_days;

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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from(NOTIFICATION_TEMPLATES_TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting notification template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete notification template' },
      { status: 500 },
    );
  }
}
