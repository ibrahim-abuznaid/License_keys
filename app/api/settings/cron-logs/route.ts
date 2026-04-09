import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { CRON_RUN_LOGS_TABLE } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from(CRON_RUN_LOGS_TABLE)
      .select('*')
      .order('ran_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching cron logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cron logs' },
      { status: 500 },
    );
  }
}
