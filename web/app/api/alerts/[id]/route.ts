import { NextResponse } from 'next/server';
import { getAllAlerts } from '@/lib/alerts/blockchain-monitor';
import { alertCache, CACHE_KEYS, CACHE_TTL } from '@/lib/alerts/cache';
import type { CryptoFlashAlert } from '@/lib/alerts/types';

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
    const cacheKey = CACHE_KEYS.alertById(id);
    const cached = alertCache.get<CryptoFlashAlert>(cacheKey);

    if (cached) {
      // Return cached data as-is (emoji will be fetched dynamically in UI)
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch all alerts and find the one matching the ID
    const allAlerts = await getAllAlerts(0); // Get all alerts
    
    // Cache individual alerts by ID so they can be found later
    allAlerts.forEach((a) => {
      const alertCacheKey = CACHE_KEYS.alertById(a.id);
      alertCache.set(alertCacheKey, a, CACHE_TTL.transaction);
    });
    
    // Try to find alert by ID first
    let alert = allAlerts.find((a) => a.id === id);

    // Fallback: If not found by ID, try to find by txHash
    // This handles old links that might have timestamp in ID, or direct txHash lookup
    if (!alert) {
      if (id.startsWith('ethereum-')) {
        // Extract txHash from ID (remove "ethereum-" prefix, handle old format with timestamp)
        const txHashMatch = id.match(/^ethereum-(0x[a-fA-F0-9]{64})/);
        if (txHashMatch && txHashMatch[1]) {
          const txHash = txHashMatch[1];
          alert = allAlerts.find((a) => a.txHash === txHash);
          console.log(`[Alert Detail] Found by txHash fallback: ${txHash}`);
        }
      } else if (id.startsWith('0x') && id.length === 66) {
        // Direct txHash (without "ethereum-" prefix)
        alert = allAlerts.find((a) => a.txHash === id);
        console.log(`[Alert Detail] Found by direct txHash: ${id}`);
      }
    }

    if (!alert) {
      console.warn(`[Alert Detail] Alert not found for ID: ${id}, total alerts: ${allAlerts.length}`);
      return NextResponse.json(
        { error: 'Alert not found', id, totalAlerts: allAlerts.length },
        { status: 404 }
      );
    }

    // Validate and normalize alert data - ensure all required fields exist
    const normalizedAlert: CryptoFlashAlert = {
      ...alert,
      // Ensure token always has all required fields (emoji is fetched dynamically in UI)
      token: {
        symbol: alert.token?.symbol || 'UNKNOWN',
        name: alert.token?.name || 'Unknown Token',
        decimals: alert.token?.decimals ?? 18,
        amount: alert.token?.amount || '0',
        amountUsd: alert.token?.amountUsd ?? 0,
      },
      // Ensure from always exists
      from: alert.from || {
        address: '',
        label: 'Unknown Wallet',
        amount: '0',
        amountUsd: 0,
      },
      // Ensure to is always an array with at least one element
      to: (Array.isArray(alert.to) && alert.to.length > 0) ? alert.to : [{
        address: '',
        label: 'Unknown Wallet',
        amount: '0',
        amountUsd: 0,
      }],
      // Ensure other required fields
      blockchain: alert.blockchain || 'ethereum',
      txHash: alert.txHash || '',
      timestamp: alert.timestamp || Date.now(),
      alertType: alert.alertType || 'large_transfer',
      severity: alert.severity || 'low',
      cryptoPriceAtTx: alert.cryptoPriceAtTx ?? 0,
      fee: alert.fee || '0',
      feeUsd: alert.feeUsd,
      blockNumber: alert.blockNumber,
      timeAgo: alert.timeAgo || 'just now',
    };

    // Cache normalized result
    alertCache.set(cacheKey, normalizedAlert, CACHE_TTL.transaction);

    return NextResponse.json(normalizedAlert, {
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

