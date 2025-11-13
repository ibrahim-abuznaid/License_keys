import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    
    return NextResponse.json(
      { authenticated },
      { status: 200 }
    );
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }
}

