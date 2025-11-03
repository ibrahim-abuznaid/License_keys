import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);

    // Fetch all keys for this email
    const { data: keys, error } = await supabase
      .from('license_keys')
      .select('*')
      .eq('email', email)
      .order('createdAt', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch keys' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: keys || [],
        email: email,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching keys for user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
