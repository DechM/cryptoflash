import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

import { sendWhaleEventToDiscord } from '@/lib/discord'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import {
  detectWhaleEventsForAsset,
  delay,
  MIN_WHALE_ALERT_USD,
  MAX_RESULTS_PER_ASSET,
  TopTokenRecord,
  TrackedAsset
} from '@/lib/whales'
import { NETWORKS } from '@/lib/whales/networks'
import { recordCronFailure, recordCronSuccess } from '@/lib/cron'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_TOKEN_LIMIT = Number(process.env.WHALE_ALERT_TOKEN_LIMIT || '10')
const PER_TOKEN_DELAY_MS = Number(process.env.WHALE_ALERT_DELAY_MS || '1500')
const WHALE_RETENTION_HOURS = Number(process.env.WHALE_EVENT_RETENTION_HOURS || '48')

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
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
        note: 'No tokens available - whale detection paused until fresh data is available'
      })
      return NextResponse.json({ 
        success: false, 
        message: 'No tokens available for whale detection - paused until fresh data',
        paused: true
      })
    }
    
    // Check if tokens are stale (older than 4 hours) - don't use stale data
    const now = Date.now()
    const staleThreshold = 4 * 60 * 60 * 1000 // 4 hours
    const freshTokens = tokens.filter(token => {
      if (!token.updated_at) return false
      const updatedAt = new Date(token.updated_at).getTime()
      return (now - updatedAt) < staleThreshold
    })
    
    if (freshTokens.length === 0) {
      await recordCronSuccess('whales:detect', {
        reviewedTokens: tokens.length,
        note: 'All tokens are stale (>4h old) - whale detection paused until fresh data'
      })
      return NextResponse.json({ 
        success: false, 
        message: 'All tokens are stale - whale detection paused until fresh data',
        paused: true,
        staleTokens: tokens.length
      })
    }
    
    // Use only fresh tokens
    const tokensToProcess = freshTokens

    const summary = {
      reviewedTokens: tokensToProcess.length,
      totalTokens: tokens.length,
      staleTokens: tokens.length - tokensToProcess.length,
      candidates: 0,
      inserted: 0,
      skippedExisting: 0,
      minUsd: MIN_WHALE_ALERT_USD,
      maxTransactions: MAX_RESULTS_PER_ASSET,
      errors: [] as string[]
    }

    for (const token of tokensToProcess as TopTokenRecord[]) {
      try {
        const networkKey = token.network || ''
        const networkConfig = networkKey ? NETWORKS[networkKey] : undefined
        if (!networkConfig) {
          summary.errors.push(`${token.token_symbol || token.token_name || token.token_address}: Unsupported network`)
          continue
        }

        const asset: TrackedAsset = {
          ...token,
          explorer_url: networkConfig.explorerTxUrl,
          network_config: networkConfig,
          asset_type: token.contract_address ? 'contract' : 'native'
        }

        const detections = await detectWhaleEventsForAsset(asset)

        if (detections.length === 0) {
          await delay(PER_TOKEN_DELAY_MS)
          continue
        }

        summary.candidates += detections.length

        const signatures = detections.map(item => item.txHash)
        const { data: existingRows, error: existingError } = await supabaseAdmin
          .from('whale_events')
          .select('tx_hash')
          .in('tx_hash', signatures)

        if (existingError) {
          console.warn('[Whale Detect] Failed to check existing whale_events:', existingError)
        }

        const existing = new Set((existingRows || []).map(row => row.tx_hash))
        const freshEvents = detections.filter(item => !existing.has(item.txHash))

        if (freshEvents.length === 0) {
          summary.skippedExisting += detections.length
          await delay(PER_TOKEN_DELAY_MS)
          continue
        }

        const payload = freshEvents.map(({ amountUsd, amountTokens, blockTime, txHash, sender, receiver, priceUsd, side }) => ({
          token_address: token.token_address,
          token_symbol: token.token_symbol,
          token_name: token.token_name,
          event_type: side,
          amount_tokens: amountTokens,
          amount_usd: amountUsd,
          price_usd: priceUsd ?? token.price_usd,
          liquidity_usd: token.liquidity_usd,
          volume_24h_usd: token.volume_24h_usd,
          sender,
          sender_label: null,
          receiver,
          receiver_label: null,
          tx_hash: txHash,
          tx_url: asset.explorer_url(txHash),
          event_data: null,
          block_time: blockTime,
          fee: null,
          chain: token.chain,
          network: token.network,
          created_at: blockTime || new Date().toISOString()
        }))

        const { error: insertError } = await supabaseAdmin
          .from('whale_events')
          .insert(payload)

        if (insertError) {
          summary.errors.push(`Insert failed for ${token.token_symbol || token.token_address.substring(0, 6)}: ${insertError.message}`)
        } else {
          summary.inserted += payload.length
          for (const item of payload) {
            try {
              const discordMessage = await sendWhaleEventToDiscord({
                ...item,
                id: crypto.randomUUID(),
                created_at: item.created_at ?? new Date().toISOString(),
                posted_to_twitter: false
              })

              if (discordMessage?.id) {
                await supabaseAdmin
                  .from('whale_events')
                  .update({
                    posted_to_discord: true,
                    discord_message_id: discordMessage.id,
                    discord_posted_at: new Date().toISOString()
                  })
                  .eq('tx_hash', item.tx_hash)
              }
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

    // Cleanup: remove whale events outside retention window to keep feed fresh
    try {
      if (WHALE_RETENTION_HOURS > 0) {
        const cutoff = new Date(Date.now() - WHALE_RETENTION_HOURS * 60 * 60 * 1000).toISOString()
        await supabaseAdmin
          .from('whale_events')
          .delete()
          .lt('block_time', cutoff)

        await supabaseAdmin
          .from('whale_events')
          .delete()
          .is('block_time', null)
          .lt('created_at', cutoff)
      }
    } catch (cleanupError) {
      console.warn('[Whale Detect] Failed to cleanup old whale events:', cleanupError)
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
