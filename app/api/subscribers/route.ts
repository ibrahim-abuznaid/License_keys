import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { LicenseKey, getKeyStatus } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawSearch = searchParams.get('search');
    const search = rawSearch ? rawSearch.trim() : '';

    const statusParam = searchParams.get('status');
    const allowedStatuses = new Set(['trial', 'customer', 'inactive']);
    const statusFilter = statusParam && allowedStatuses.has(statusParam)
      ? (statusParam as 'trial' | 'customer' | 'inactive')
      : null;

    const pageParam = Number.parseInt(searchParams.get('page') ?? '1', 10);
    const pageSizeParam = Number.parseInt(searchParams.get('pageSize') ?? '10', 10);
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const pageSizeBase = Number.isNaN(pageSizeParam) || pageSizeParam < 1 ? 10 : pageSizeParam;
    const pageSize = Math.min(pageSizeBase, 100); // enforce reasonable upper bound

    // Fetch all keys
    let query = supabase
      .from('license_keys')
      .select('*')
      .order('createdAt', { ascending: false });

    if (search) {
      const escapedSearch = search.replace(/[%_]/g, (match) => `\\${match}`);
      const searchPattern = `%${escapedSearch}%`;
      query = query.or(`email.ilike.${searchPattern},key.ilike.${searchPattern}`);
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
      fullName?: string;
      companyName?: string;
    }>();

    keys?.forEach(key => {
      const typedKey = key as LicenseKey;
      const email = typedKey.email;
      const status = getKeyStatus(typedKey);
      
      if (!subscribersMap.has(email)) {
        subscribersMap.set(email, {
          email,
          totalKeys: 0,
          trialKeys: 0,
          developmentKeys: 0,
          productionKeys: 0,
          activeKeys: 0,
          latestCreatedAt: typedKey.createdAt,
          hasActiveTrial: false,
          fullName: typedKey.fullName || undefined,
          companyName: typedKey.companyName || undefined,
        });
      }

      const subscriber = subscribersMap.get(email)!;
      subscriber.totalKeys++;
      
      if (typedKey.keyType === 'trial') subscriber.trialKeys++;
      if (typedKey.keyType === 'development') subscriber.developmentKeys++;
      if (typedKey.keyType === 'production') subscriber.productionKeys++;
      
      if (status === 'active') subscriber.activeKeys++;
      
      if (status === 'active' && typedKey.isTrial) {
        subscriber.hasActiveTrial = true;
      }
      
      // Update latest created date and info
      if (new Date(typedKey.createdAt) > new Date(subscriber.latestCreatedAt)) {
        subscriber.latestCreatedAt = typedKey.createdAt;
        if (typedKey.fullName) subscriber.fullName = typedKey.fullName;
        if (typedKey.companyName) subscriber.companyName = typedKey.companyName;
      }
    });

    // Convert map to array, add status, and sort by latest activity
    const subscribers = Array.from(subscribersMap.values())
      .map((subscriber) => {
        const status: 'trial' | 'customer' | 'inactive' = subscriber.hasActiveTrial
          ? 'trial'
          : subscriber.activeKeys > 0
            ? 'customer'
            : 'inactive';

        return {
          ...subscriber,
          status,
        };
      })
      .sort((a, b) => 
      new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime()
    );

    const filteredSubscribers = statusFilter
      ? subscribers.filter((subscriber) => subscriber.status === statusFilter)
      : subscribers;

    const total = filteredSubscribers.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const data = filteredSubscribers.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total,
        page: safePage,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



