import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { LicenseKey, getKeyStatus } from '@/lib/types';
import { LICENSE_KEYS_TABLE } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('========================================');
    console.log('🔍 SUBSCRIBERS API - Request Started');
    console.log('========================================');
    
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

    console.log('📋 Request Params:', {
      search,
      statusFilter,
      page,
      pageSize,
      tableName: LICENSE_KEYS_TABLE
    });

    // Fetch all keys
    console.log('🔎 Querying Supabase table:', LICENSE_KEYS_TABLE);
    console.log('🔑 Using: supabaseAdmin (service role key)');
    let query = supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .select('*')
      .order('createdAt', { ascending: false });

    if (search) {
      const escapedSearch = search.replace(/[%_]/g, (match) => `\\${match}`);
      const searchPattern = `%${escapedSearch}%`;
      query = query.or(`email.ilike.${searchPattern},key.ilike.${searchPattern}`);
      console.log('🔍 Search filter applied:', searchPattern);
    }

    const { data: keys, error } = await query;

    console.log('📊 Supabase Query Result:', {
      success: !error,
      keysCount: keys?.length ?? 0,
      hasError: !!error,
      errorDetails: error ? JSON.stringify(error) : null
    });

    if (error) {
      console.error('❌ Supabase Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch keys', details: error },
        { status: 500 }
      );
    }

    if (!keys || keys.length === 0) {
      console.log('⚠️ No keys returned from database');
      return NextResponse.json({
        success: true,
        data: [],
        meta: { total: 0, page: 1, pageSize, totalPages: 1 },
      });
    }

    console.log('✅ Keys fetched successfully:', keys.length);
    console.log('📝 Sample key (first one):', JSON.stringify(keys[0], null, 2));

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

    console.log('🔄 Processing keys to group by email...');
    
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
      
      // Count trial keys based on isTrial flag instead of keyType
      if (typedKey.isTrial) subscriber.trialKeys++;
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

    console.log('👥 Unique subscribers found:', subscribersMap.size);
    console.log('📧 Subscriber emails:', Array.from(subscribersMap.keys()).slice(0, 5).join(', '), subscribersMap.size > 5 ? '...' : '');

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

    console.log('🔍 Status filter applied:', statusFilter || 'none');
    console.log('📊 After filtering:', filteredSubscribers.length, 'subscribers');

    const total = filteredSubscribers.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const data = filteredSubscribers.slice(startIndex, startIndex + pageSize);

    console.log('📄 Pagination:', {
      total,
      page: safePage,
      pageSize,
      totalPages,
      startIndex,
      returnedCount: data.length
    });

    console.log('✅ Response data (first item):', data.length > 0 ? JSON.stringify(data[0], null, 2) : 'No data');
    console.log('========================================');
    console.log('✅ SUBSCRIBERS API - Request Complete');
    console.log('========================================\n');

    return NextResponse.json(
      {
        success: true,
        data,
        meta: {
          total,
          page: safePage,
          pageSize,
          totalPages,
        },
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
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



