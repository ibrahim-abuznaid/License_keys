import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    // Fetch all keys
    let query = supabase
      .from('license_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`customer_email.ilike.%${search}%`);
    }

    const { data: keys, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch keys' },
        { status: 500 }
      );
    }

    // Group keys by email and create subscriber summary
    const subscribersMap = new Map<string, {
      email: string;
      totalKeys: number;
      trialKeys: number;
      developmentKeys: number;
      productionKeys: number;
      activeKeys: number;
      latestCreatedAt: string;
      hasActiveTrial: boolean;
    }>();

    keys?.forEach(key => {
      const email = key.customer_email;
      
      if (!subscribersMap.has(email)) {
        subscribersMap.set(email, {
          email,
          totalKeys: 0,
          trialKeys: 0,
          developmentKeys: 0,
          productionKeys: 0,
          activeKeys: 0,
          latestCreatedAt: key.created_at,
          hasActiveTrial: false,
        });
      }

      const subscriber = subscribersMap.get(email)!;
      subscriber.totalKeys++;
      
      if (key.key_type === 'trial') subscriber.trialKeys++;
      if (key.key_type === 'development') subscriber.developmentKeys++;
      if (key.key_type === 'production') subscriber.productionKeys++;
      
      if (key.status === 'active') subscriber.activeKeys++;
      
      if (key.status === 'active' && key.key_type === 'trial') {
        subscriber.hasActiveTrial = true;
      }
      
      // Update latest created date
      if (new Date(key.created_at) > new Date(subscriber.latestCreatedAt)) {
        subscriber.latestCreatedAt = key.created_at;
      }
    });

    // Convert map to array and sort by latest activity
    const subscribers = Array.from(subscribersMap.values()).sort((a, b) => 
      new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: subscribers,
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

