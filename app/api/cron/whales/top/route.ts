import { NextRequest, NextResponse } from 'next/server'

import { isSupabaseConfigured } from '@/lib/supabase'
import { listTrackedAssets, persistTopAssets } from '@/lib/whales'
import { recordCronFailure, recordCronSuccess } from '@/lib/cron'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const limit = Number(process.env.WHALE_ALERT_TOKEN_LIMIT || '10')
    const trackedAssets = await listTrackedAssets(limit)

    if (!trackedAssets.length) {
      // Empty result could mean rate limit or no data
      // Rate limit is handled in fetchTopCoins/fetchCoinDetails (returns empty/null)
      await recordCronSuccess('whales:top', {
        updated: 0,
        source: 'none',
        note: 'No tokens available from CoinGecko (may be rate limited)'
      })
      return NextResponse.json({ 
        success: false, 
        message: 'No tokens available from CoinGecko',
        rateLimited: true // Assume rate limited if empty
      })
    }

    await persistTopAssets(trackedAssets)

    const summary = {
      updated: trackedAssets.length,
      source: 'coingecko'
    }
    await recordCronSuccess('whales:top', summary)
    return NextResponse.json({ success: true, ...summary })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    const isRateLimited = message.includes('429') || message.includes('rate limit')
    
    if (isRateLimited) {
      // Don't treat rate limit as failure - it's expected when limit is hit
      console.warn('[Whale Cron] CoinGecko rate limit exceeded - monthly limit hit')
      await recordCronSuccess('whales:top', {
        updated: 0,
        source: 'none',
        note: 'CoinGecko rate limit exceeded - will retry after reset (Dec 1)'
      })
      return NextResponse.json({ 
        success: false, 
        message: 'CoinGecko rate limit exceeded',
        rateLimited: true
      })
    }
    
    console.error('[Whale Cron] Unexpected error in top tokens job:', message)
    await recordCronFailure('whales:top', message)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
