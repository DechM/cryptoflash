/**
 * Twitter API v2 Integration
 * For posting KOTH alerts to Twitter/X
 */

import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

import { WhaleEvent } from '@/lib/types'

interface TwitterToken {
  name: string
  symbol: string
  address: string
  score: number
  progress: number
  priceUsd?: number
  whaleUsd?: number
  whaleWindow?: string
}

interface TwitterPostResponse {
  id: string
  text: string
}


function shortAddress(address?: string | null, chars: number = 4) {
  if (!address) return 'Unknown'
  if (address.length <= chars * 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

function formatUsdCompact(amount?: number | null) {
  if (!amount || !isFinite(amount)) return '$0'
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatTokenCompact(amount?: number | null) {
  if (!amount || !isFinite(amount)) return ''
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })
}

export function formatWhaleTweet(event: WhaleEvent): string {
  const tokenName = event.token_name || ''
  const tokenSymbol = event.token_symbol ? `$${event.token_symbol}` : ''
  const headline = `${tokenName} ${tokenSymbol}`.trim() || `$${shortAddress(event.token_address, 4)}`

  const valuePart = formatUsdCompact(event.amount_usd)
  const tokenAmount = formatTokenCompact(event.amount_tokens)
  const amountLine = tokenAmount ? `${valuePart} • ${tokenAmount} tokens` : valuePart

  let descriptor = '🔁 Whale transfer'
  if (event.event_type === 'mint') descriptor = '🪙 Minted supply'
  if (event.event_type === 'burn') descriptor = '🔥 Supply burned'
  if (event.event_type === 'exchange') descriptor = '🏛️ Exchange flow'

  const sender = shortAddress(event.sender, 4)
  const receiver = shortAddress(event.receiver, 4)
  const movementLine = `From ${sender} → ${receiver}`

  const siteLink = 'cryptoflash.app/whale-alerts'
  const hashtags = '#Solana #WhaleAlert #CryptoFlash'

  return `🐳 Whale Alert!

${headline}
💰 ${amountLine}
${descriptor}
${movementLine}

👉 Watch live: ${siteLink}

${hashtags}

⚠️ DYOR • NFA`
}

/**
 * Format Twitter post message (NO direct pump.fun links for safety)
 * Includes link to our website for traffic
 * Includes hashtags for better reach and engagement
 * Optimized for engagement and virality (2024-2025 best practices)
 */
export function formatTwitterPost(token: TwitterToken): string {
  const progress = token.progress || 0
  const score = token.score || 0

  const progressLine = `⚡ Progress: ${progress.toFixed(1)}% • Score ${score.toFixed(1)}`

  let secondaryLine: string | null = null
  if (typeof token.whaleUsd === 'number' && token.whaleUsd > 0) {
    const windowText = token.whaleWindow || 'recently'
    secondaryLine = `🐳 Whale flow: +${formatUsdCompact(token.whaleUsd)} (${windowText})`
  } else if (typeof token.priceUsd === 'number') {
    secondaryLine = `💵 Price: $${token.priceUsd.toFixed(6)}`
  }

  const lines = [
    `$${token.symbol} // KOTH RACE ⚔️`,
    '',
    'Progress surges. Whales circling. Score ticking up.',
    '',
    progressLine,
  ]

  if (secondaryLine) {
    lines.push(secondaryLine)
  }

  lines.push(
    '',
    `CA: ${token.address}`,
    '',
    '👁‍🗨 Track it live on CryptoFlash.',
    'Follow @CryptoFlashGuru for instant alerts.'
  )

  return lines.join('\n')
}

/**
 * Post a tweet to Twitter/X using API v2
 * Requires OAuth 1.0a User Context (not Bearer Token)
 */
export async function postTweet(text: string): Promise<TwitterPostResponse | { rateLimited: true; resetAt: number | null } | null> {
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    console.error('Twitter OAuth 1.0a credentials not configured. Need: API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET')
    return null
  }

  try {
    // Create OAuth 1.0a instance
    const oauth = new OAuth({
      consumer: {
        key: apiKey,
        secret: apiSecret
      },
      signature_method: 'HMAC-SHA1',
      hash_function(baseString, key) {
        return crypto.createHmac('sha1', key).update(baseString).digest('base64')
      }
    })

    const token = {
      key: accessToken,
      secret: accessTokenSecret
    }

    const url = 'https://api.twitter.com/2/tweets'
    const requestData = {
      url,
      method: 'POST'
    }

    // Generate OAuth 1.0a authorization header
    const authHeader = oauth.toHeader(oauth.authorize(requestData, token))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader.Authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.substring(0, 280) // Twitter limit is 280 characters
      })
    })

    const remaining = response.headers.get('x-rate-limit-remaining')
    const reset = response.headers.get('x-rate-limit-reset')
    if (remaining !== null) {
      const resetTime = reset ? new Date(parseInt(reset, 10) * 1000).toISOString() : 'unknown'
      console.log(`[Twitter API] Rate limit remaining: ${remaining}, reset at: ${resetTime}`)
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Twitter API error:', response.status, errorData)

      if (response.status === 429) {
        const resetSeconds = reset ? parseInt(reset, 10) : null
        return { rateLimited: true, resetAt: resetSeconds }
      }

      return null
    }

    const data = await response.json()
    return {
      id: data.data.id,
      text: data.data.text
    }
  } catch (error: any) {
    console.error('Error posting to Twitter:', error.message)
    return null
  }
}

/**
 * Check rate limits for Twitter API
 * Returns: { remaining: number, resetAt: Date }
 */
export async function checkRateLimit(): Promise<{ remaining: number; resetAt: Date | null } | null> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN

  if (!bearerToken) {
    return null
  }

  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      }
    })

    // Rate limit headers
    const remaining = parseInt(response.headers.get('x-rate-limit-remaining') || '0', 10)
    const reset = response.headers.get('x-rate-limit-reset')
    const resetAt = reset ? new Date(parseInt(reset, 10) * 1000) : null

    return { remaining, resetAt }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return null
  }
}

