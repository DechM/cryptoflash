import { NextResponse } from 'next/server';
import { getAllAlerts } from '@/lib/alerts/blockchain-monitor';
import { alertCache, CACHE_KEYS, CACHE_TTL } from '@/lib/alerts/cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid alert ID' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = CACHE_KEYS.transaction(id);
    const cached = alertCache.get(cacheKey);

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch all alerts and find the one matching the ID
    const allAlerts = await getAllAlerts(0); // Get all alerts
    const alert = allAlerts.find((a) => a.id === id);

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Cache result
    alertCache.set(cacheKey, alert, CACHE_TTL.transaction);

    return NextResponse.json(alert, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Alert detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert details' },
      { status: 500 }
    );
  }
}

