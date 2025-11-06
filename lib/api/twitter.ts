/**
 * Twitter API v2 Integration
 * For posting KOTH alerts to Twitter/X
 */

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
 */
export async function postTweet(text: string): Promise<TwitterPostResponse | null> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

  if (!bearerToken && (!apiKey || !apiSecret || !accessToken || !accessTokenSecret)) {
    console.error('Twitter API credentials not configured')
    return null
  }

  try {
    // Use OAuth 1.0a for posting (more reliable than Bearer Token for write operations)
    // For simplicity, we'll use Bearer Token if available, otherwise OAuth 1.0a
    
    let authHeader: string
    
    if (bearerToken) {
      // Use Bearer Token (simpler, but may have limitations)
      authHeader = `Bearer ${bearerToken}`
    } else {
      // OAuth 1.0a would require crypto library - for now, use Bearer Token approach
      console.error('OAuth 1.0a not implemented - using Bearer Token only')
      return null
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
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

