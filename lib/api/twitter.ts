/**
 * Twitter API v2 Integration
 * For posting KOTH alerts to Twitter/X
 */

import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

interface TwitterToken {
  name: string
  symbol: string
  address: string
  score: number
  progress: number
  priceUsd?: number
}

interface TwitterPostResponse {
  id: string
  text: string
}

/**
 * Format Twitter post message (NO direct pump.fun links for safety)
 * Includes link to our website for traffic
 * Includes hashtags for better reach and engagement
 */
export function formatTwitterPost(token: TwitterToken): string {
  // Simple link to our website (no tracking parameters)
  const siteLink = "https://cryptoflash.app"
  
  // Hashtags in exact order for optimal reach
  const hashtags = "#PumpFun #KOTH #Solana #Memecoin #SolanaGems"
  
  // Safely format price - check if it's a number
  const priceText = token.priceUsd && typeof token.priceUsd === 'number' 
    ? `💵 Price: $${token.priceUsd.toFixed(6)}` 
    : ''
  
  return `🚨 KOTH Alert!

💰 ${token.name} ($${token.symbol})
📊 Score: ${token.score.toFixed(1)}/100
📈 Progress: ${token.progress.toFixed(1)}%
${priceText}

🔍 ${siteLink}

${hashtags}

⚠️ DYOR • NFA`
}

/**
 * Post a tweet to Twitter/X using API v2
 * Requires OAuth 1.0a User Context (not Bearer Token)
 */
export async function postTweet(text: string): Promise<TwitterPostResponse | null> {
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Twitter API error:', response.status, errorData)
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

