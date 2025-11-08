import { NextRequest, NextResponse } from 'next/server'

import { HELIUS_API_AVAILABLE } from '@/lib/api/helius'
import { sendWhaleEventToDiscord } from '@/lib/discord'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { detectWhaleTransfersForToken, delay, MIN_WHALE_ALERT_USD, MAX_WHALE_SIGNATURES, TopTokenRecord } from '@/lib/whales'
import { recordCronFailure, recordCronSuccess } from '@/lib/cron'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_TOKEN_LIMIT = Number(process.env.WHALE_ALERT_TOKEN_LIMIT || '12')
const PER_TOKEN_DELAY_MS = Number(process.env.WHALE_ALERT_DELAY_MS || '2000')

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  if (!HELIUS_API_AVAILABLE) {
    return NextResponse.json({ error: 'Helius API key missing' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: tokens, error } = await supabaseAdmin
      .from('whale_top_tokens')
      .select('*')
      .order('liquidity_usd', { ascending: false })
      .limit(DEFAULT_TOKEN_LIMIT)

    if (error) {
      console.error('[Whale Detect] Failed to fetch whale_top_tokens:', error)
      await recordCronFailure('whales:detect', error)
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    if (!tokens || tokens.length === 0) {
      await recordCronSuccess('whales:detect', {
        reviewedTokens: 0,
        note: 'No tokens available'
      })
      return NextResponse.json({ success: false, message: 'No tokens available for whale detection' })
    }

    const summary = {
      reviewedTokens: tokens.length,
      candidates: 0,
      inserted: 0,
      skippedExisting: 0,
      minUsd: MIN_WHALE_ALERT_USD,
      maxSignatures: MAX_WHALE_SIGNATURES,
      errors: [] as string[]
    }

    for (const token of tokens as TopTokenRecord[]) {
      try {
        const detections = await detectWhaleTransfersForToken(token)

        if (detections.length === 0) {
          await delay(PER_TOKEN_DELAY_MS)
          continue
        }

        summary.candidates += detections.length

        const signatures = detections.map(item => item.signature)
        const { data: existingRows, error: existingError } = await supabaseAdmin
          .from('whale_events')
          .select('tx_hash')
          .in('tx_hash', signatures)

        if (existingError) {
          console.warn('[Whale Detect] Failed to check existing whale_events:', existingError)
        }

        const existing = new Set((existingRows || []).map(row => row.tx_hash))
        const freshEvents = detections.filter(item => !existing.has(item.signature))

        if (freshEvents.length === 0) {
          summary.skippedExisting += detections.length
          await delay(PER_TOKEN_DELAY_MS)
          continue
        }

        const payload = freshEvents.map(({ event }) => ({
          ...event,
          created_at: event.block_time || new Date().toISOString()
        }))

        const { error: insertError } = await supabaseAdmin
          .from('whale_events')
          .insert(payload)

        if (insertError) {
          summary.errors.push(`Insert failed for ${token.token_symbol || token.token_address.substring(0, 6)}: ${insertError.message}`)
        } else {
          summary.inserted += payload.length
          for (const item of freshEvents) {
            try {
            await sendWhaleEventToDiscord({
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              posted_to_twitter: false,
              ...item.event
            })
            } catch (discordError) {
              console.warn('[Whale Detect] Failed to post to Discord:', discordError)
            }
          }
        }
      } catch (tokenError: unknown) {
        const message = tokenError instanceof Error ? tokenError.message : String(tokenError)
        summary.errors.push(`${token.token_symbol || token.token_address.substring(0, 6)}: ${message}`)
      }

      await delay(PER_TOKEN_DELAY_MS)
    }

    await recordCronSuccess('whales:detect', summary)
    return NextResponse.json({ success: true, ...summary })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Whale Detect] Unexpected error:', message)
    await recordCronFailure('whales:detect', message)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
