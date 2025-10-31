import { NextResponse } from 'next/server';
import { getAllAlerts, filterAlerts } from '@/lib/alerts/blockchain-monitor';
import { alertCache, CACHE_KEYS, CACHE_TTL } from '@/lib/alerts/cache';
import { ALERT_THRESHOLDS } from '@/lib/alerts/types';
import type { AlertFilters } from '@/lib/alerts/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: AlertFilters = {
      blockchains: searchParams.get('blockchains')?.split(',') as any,
      alertTypes: searchParams.get('alertTypes')?.split(',') as any,
      severities: searchParams.get('severities')?.split(',') as any,
      minAmountUsd: searchParams.get('minAmountUsd')
        ? parseFloat(searchParams.get('minAmountUsd')!)
        : undefined,
      maxAmountUsd: searchParams.get('maxAmountUsd')
        ? parseFloat(searchParams.get('maxAmountUsd')!)
        : undefined,
      tokens: searchParams.get('tokens')?.split(','),
    };

    // Check cache first
    const cacheKey = `alerts:${JSON.stringify(filters)}`;
    const cached = alertCache.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch fresh alerts - $100k threshold for whale transactions only
    const minAmountUsd = filters.minAmountUsd ?? ALERT_THRESHOLDS.low; // Default $100k for whales
    const allAlerts = await getAllAlerts(minAmountUsd);
    
    // Force refresh bypasses cache
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    if (forceRefresh) {
      // Clear cache for this specific filter
      alertCache.clear();
    }
    
    // Cache individual alerts by ID so they can be found by detail route
    allAlerts.forEach((alert) => {
      const alertCacheKey = CACHE_KEYS.alertById(alert.id);
      alertCache.set(alertCacheKey, alert, CACHE_TTL.transaction);
    });
    
    // Apply filters
    const filteredAlerts = filterAlerts(allAlerts, filters);

    // Cache result
    alertCache.set(cacheKey, filteredAlerts, CACHE_TTL.alerts);

    return NextResponse.json(filteredAlerts, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

