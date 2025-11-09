import { NextRequest, NextResponse } from 'next/server'

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { fetchTrendingSolanaPairs, TopTokenRecord } from '@/lib/whales'
import { recordCronFailure, recordCronSuccess } from '@/lib/cron'
import { isValidSolanaAddress, sanitizeSolanaAddress } from '@/lib/solana'

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
    const limit = 80
    const primaryTokens = await fetchTrendingSolanaPairs(limit)

    let tokens = primaryTokens

    if (!tokens.length) {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/g, '') || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')).replace(/\/$/, '')
        const fallbackResponse = await fetch(`${baseUrl}/api/koth-data`, {
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        })

        if (fallbackResponse.ok) {
          const { tokens: kothTokens } = await fallbackResponse.json() as {
            tokens: Array<{ tokenAddress: string; symbol?: string; name?: string; priceUsd?: number; liquidity?: number; volume24h?: number }>
          }

          if (Array.isArray(kothTokens) && kothTokens.length) {
            const mapped = kothTokens
              .slice(0, limit)
              .map((token): TopTokenRecord | null => {
                const address = sanitizeSolanaAddress(token.tokenAddress)
                if (!address) return null
                return {
                  token_address: address,
                  token_symbol: token.symbol || null,
                  token_name: token.name || null,
                  price_usd: typeof token.priceUsd === 'number' ? token.priceUsd : null,
                  liquidity_usd: typeof token.liquidity === 'number' ? token.liquidity : null,
                  volume_24h_usd: typeof token.volume24h === 'number' ? token.volume24h : null,
                  txns_24h: null,
                  updated_at: new Date().toISOString()
                }
              })
              .filter((item): item is TopTokenRecord => item !== null)

            if (mapped.length) {
              tokens = mapped
              console.warn('[Whale Cron] Falling back to KOTH tokens due to Birdeye unavailability')
            }
          }
        } else {
          console.warn('[Whale Cron] KOTH fallback request failed:', fallbackResponse.status)
        }
      } catch (fallbackError) {
        const message = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        console.error('[Whale Cron] Fallback to KOTH tokens failed:', message)
      }
    }

    if (!tokens.length) {
      await recordCronSuccess('whales:top', {
        updated: 0,
        source: 'none',
        note: 'No token sources available'
      })
      return NextResponse.json({ success: false, message: 'No token sources available (Birdeye + fallback failed)' })
    }

    const { error } = await supabaseAdmin
      .from('whale_top_tokens')
      .upsert(tokens, { onConflict: 'token_address' })

    if (error) {
      console.error('[Whale Cron] Failed to upsert whale_top_tokens:', error)
      return NextResponse.json({ error: 'Failed to upsert whale_top_tokens' }, { status: 500 })
    }

    const summary = {
      updated: tokens.length,
      source: primaryTokens.length ? 'birdeye' : 'koth'
    }
    await recordCronSuccess('whales:top', summary)
    return NextResponse.json({ success: true, ...summary })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Whale Cron] Unexpected error in top tokens job:', message)
    await recordCronFailure('whales:top', message)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
