/**
 * X (Twitter) Profile Monitoring
 * Monitors X accounts for breaking crypto news and reformats them
 */

import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

export interface XTweet {
  id: string
  text: string
  author_id: string
  author_username: string
  created_at: string
  media_urls?: string[]
  video_urls?: string[]
  public_metrics?: {
    like_count?: number
    retweet_count?: number
    reply_count?: number
  }
}

export interface XUser {
  id: string
  username: string
  name: string
}

// Top X accounts to monitor (24 most important crypto news sources)
const MONITORED_ACCOUNTS = [
  'WatcherGuru',        // Real-time crypto/finance JUST IN, 10-20/ден, 3.6M followers
  'DeItaone',           // Bloomberg macro + regs, 5-15/ден, 1.1M followers
  'lookonchain',        // On-chain whales/hacks, 15-25/ден, 671k followers
  'tier10k',            // DeFi yields/airdrop alerts, 8-12/ден, 479k followers
  'tree_of_alpha',      // Altcoin pumps/listings, 10-15/ден, 242k followers
  '0xfoobar',           // ETH upgrades/L2, 5-10/ден, 179k followers
  'unusual_whales',     // ETF flows + macro alerts, 2.5M followers
  'BTC_Archive',        // BTC history + news, 5-8/ден, 11k followers
  'onchainalerts',      // Pure on-chain, 10/ден, 2 followers
  'arkhamintel',        // Arkham on-chain intel, 8-12/ден
  'nansen_ai',          // Nansen flows/alerts, 7-10/ден, 348k followers
  'whale_alert_io',     // Whale moves ($100M+), 20+/ден, 273 followers
  'Cointelegraph',      // Official crypto news, 10-15/ден, 2.9M followers
  'CoinDesk',           // Leading news/alerts, 12-18/ден, 3.4M followers
  'TheBlock__',         // Research + breaking, 8-12/ден, 122k followers
  'CryptoSlate',        // Insights + data alerts, 10/ден, 68k followers
  'DecryptMedia',       // Hacks/DeFi news, 9-14/ден, 237k followers
  'CryptoKaleo',        // Bull/bear signals, 6-10/ден, 730k followers
  'CryptoCred',         // Trading alerts, 5-8/ден, 732k followers
  'CryptoCobain',       // Memes + breaking, 5-10/ден, 1.3k followers
  'cz_binance',         // Binance listings/regs, 8.5M followers
  'VitalikButerin',     // ETH/L2 updates, 5.2M followers
  'sassal0x',           // ETH/DeFi deep dives, 520k followers
  'woonomic',          // On-chain BTC analysis, 1.1M followers
  'APompliano'         // Macro/crypto insights, 1.6M followers
] as const

/**
 * Get OAuth 1.0a headers for Twitter API
 */
function getOAuthHeaders(method: string, url: string): string {
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error('Twitter OAuth credentials not configured')
  }

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

  const requestData = {
    url,
    method
  }

  const authHeader = oauth.toHeader(oauth.authorize(requestData, token))
  return authHeader.Authorization
}

/**
 * Get user ID by username
 */
export async function getUserByUsername(username: string): Promise<XUser | null> {
  try {
    const url = `https://api.twitter.com/2/users/by/username/${username}?user.fields=name`
    const authHeader = getOAuthHeaders('GET', url)

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader
      }
    })

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - check retry-after header
        const retryAfter = response.headers.get('retry-after')
        const resetAt = response.headers.get('x-rate-limit-reset')
        console.warn(`[X Monitor] Rate limited for ${username}: 429. Retry after: ${retryAfter}s, Reset at: ${resetAt}`)
      } else {
        console.warn(`[X Monitor] Failed to get user ${username}: ${response.status}`)
      }
      return null
    }

    const data = await response.json()
    if (data.data) {
      return {
        id: data.data.id,
        username: data.data.username,
        name: data.data.name
      }
    }

    return null
  } catch (error: any) {
    console.warn(`[X Monitor] Error getting user ${username}:`, error.message)
    return null
  }
}

/**
 * Get recent tweets from a user
 * Free tier: 1 request / 15 mins per user
 * Includes retry logic for rate limiting (429 errors)
 */
export async function getUserTweets(
  userId: string,
  username: string,
  sinceId?: string,
  maxResults: number = 10
): Promise<XTweet[]> {
  let retries = 0
  const maxRetries = 2 // Only retry twice to avoid long delays
  let lastError: any = null

  while (retries <= maxRetries) {
    try {
      let url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,author_id,public_metrics&expansions=attachments.media_keys&media.fields=url,preview_image_url,type,variants`
      
      if (sinceId) {
        url += `&since_id=${sinceId}`
      }

      const authHeader = getOAuthHeaders('GET', url)

      const response = await fetch(url, {
        headers: {
          'Authorization': authHeader
        }
      })

      if (response.ok) {
        const data = await response.json()
        const tweets: XTweet[] = []

        if (data.data && Array.isArray(data.data)) {
          // Get media URLs from includes (separate images and videos)
          const imageMap = new Map<string, string>()
          const videoMap = new Map<string, string>()
          
          if (data.includes?.media) {
            for (const media of data.includes.media) {
              if (media.media_key) {
                if (media.type === 'video' || media.type === 'animated_gif') {
                  // Find the highest bitrate video variant
                  const videoVariant = media.variants
                    ?.filter((v: any) => v.content_type === 'video/mp4')
                    .sort((a: any, b: any) => (b.bit_rate || 0) - (a.bit_rate || 0))
                    ?.[0]
                  if (videoVariant?.url) {
                    videoMap.set(media.media_key, videoVariant.url)
                  } else if (media.url) {
                    videoMap.set(media.media_key, media.url)
                  }
                } else if (media.url || media.preview_image_url) {
                  imageMap.set(media.media_key, media.url || media.preview_image_url)
                }
              }
            }
          }

          for (const tweet of data.data) {
            const mediaUrls: string[] = []
            const videoUrls: string[] = []
            
            if (tweet.attachments?.media_keys) {
              for (const key of tweet.attachments.media_keys) {
                if (videoMap.has(key)) {
                  videoUrls.push(videoMap.get(key)!)
                } else if (imageMap.has(key)) {
                  mediaUrls.push(imageMap.get(key)!)
                }
              }
            }

            tweets.push({
              id: tweet.id,
              text: tweet.text,
              author_id: tweet.author_id,
              author_username: username,
              created_at: tweet.created_at,
              media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
              video_urls: videoUrls.length > 0 ? videoUrls : undefined,
              public_metrics: tweet.public_metrics
            })
          }
        }

        return tweets
      }

      // Handle rate limiting (429)
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}))
        // Twitter API free tier: 1 request / 15 mins per user
        // If rate limited, don't retry now - skip and try in next cron run (15 mins later)
        console.warn(`[X Monitor] Rate limited (429) for ${username} (${userId}). Skipping - will retry in next cron run (15 mins).`)
        // Return empty array - next cron run will try again
        return []
      }

      // Other errors
      const errorData = await response.json().catch(() => ({}))
      console.warn(`[X Monitor] Failed to get tweets for user ${userId}: ${response.status}`, errorData)
      lastError = { status: response.status, message: errorData }
      break
    } catch (error: any) {
      console.warn(`[X Monitor] Error getting tweets for user ${userId}:`, error.message)
      lastError = error
      break
    }
  }

  // If we exhausted retries or got other errors, return empty array
  if (lastError) {
    console.warn(`[X Monitor] Failed to get tweets for ${username} after retries:`, lastError)
  }
  
  return []
}

/**
 * Get all monitored accounts (usernames only)
 */
export function getMonitoredAccounts(): readonly string[] {
  return MONITORED_ACCOUNTS
}

/**
 * Get user ID from database cache (to avoid rate limits)
 * Free tier: 1 request / 24 hours per user for getUserByUsername
 * This function uses database cache to avoid hitting rate limits
 */
export async function getCachedUserId(username: string): Promise<string | null> {
  const { supabaseAdmin } = await import('@/lib/supabase')
  
  try {
    // Check database cache first
    const { data: cached } = await supabaseAdmin
      .from('x_user_ids')
      .select('user_id, last_updated')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (cached?.user_id) {
      // Check if cache is still valid (less than 23 hours old to be safe)
      const lastUpdated = new Date(cached.last_updated).getTime()
      const now = Date.now()
      const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60)
      
      if (hoursSinceUpdate < 23) {
        // Cache is still valid, use it
        console.log(`[X Monitor] Using cached user ID for ${username}`)
        return cached.user_id
      } else {
        // Cache expired, try to refresh (but only if we haven't hit rate limit)
        console.log(`[X Monitor] Cache expired for ${username}, attempting refresh...`)
      }
    }

    // Cache miss or expired - fetch from API (only if we haven't hit rate limit recently)
    const user = await getUserByUsername(username)
    if (user) {
      // Save to database cache
      await supabaseAdmin
        .from('x_user_ids')
        .upsert({
          username: username.toLowerCase(),
          user_id: user.id,
          name: user.name,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'username'
        })
      
      console.log(`[X Monitor] Cached user ID for ${username}: ${user.id}`)
      return user.id
    }

    console.warn(`[X Monitor] Could not get user ID for ${username}`)
    return null
  } catch (error: any) {
    console.error(`[X Monitor] Error getting cached user ID for ${username}:`, error.message)
    return null
  }
}

