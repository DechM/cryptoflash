import { NextRequest, NextResponse } from 'next/server'

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { fetchTrendingSolanaPairs, mapPairsToTopTokens } from '@/lib/whales'

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
    const pairs = await fetchTrendingSolanaPairs(80)
    if (!pairs.length) {
      return NextResponse.json({ success: false, message: 'No trending pairs fetched' })
    }

    const tokens = mapPairsToTopTokens(pairs)
    if (!tokens.length) {
      return NextResponse.json({ success: false, message: 'No Solana tokens mapped from DexScreener response' })
    }

    const { error } = await supabaseAdmin
      .from('whale_top_tokens')
      .upsert(tokens, { onConflict: 'token_address' })

    if (error) {
      console.error('[Whale Cron] Failed to upsert whale_top_tokens:', error)
      return NextResponse.json({ error: 'Failed to upsert whale_top_tokens' }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: tokens.length })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Whale Cron] Unexpected error in top tokens job:', message)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
