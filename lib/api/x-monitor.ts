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

// Top X accounts to monitor (15-20 most important)
const MONITORED_ACCOUNTS = [
  'WatcherGuru',
  'DeItaone',
  'lookonchain',
  'tier10k',
  'tree_of_alpha',
  '0xfoobar',
  'CryptoWhale',
  'BTC_Archive',
  'onchainalerts',
  'arkhamintel',
  'nansen_ai',
  'whale_alert_io',
  'Cointelegraph',
  'CoinDesk',
  'TheBlock__',
  'CryptoSlate',
  'DecryptMedia',
  'CryptoKaleo',
  'CryptoCred',
  'CryptoCobain'
] as const

// Cache for user IDs (to avoid hitting rate limits)
// Free tier: 1 request / 24 hours per user for getUserByUsername
const userIdCache = new Map<string, string>()

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
      console.warn(`[X Monitor] Failed to get user ${username}: ${response.status}`)
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
 */
export async function getUserTweets(
  userId: string,
  username: string,
  sinceId?: string,
  maxResults: number = 10
): Promise<XTweet[]> {
  try {
    let url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,author_id,public_metrics&expansions=attachments.media_keys&media.fields=url,preview_image_url`
    
    if (sinceId) {
      url += `&since_id=${sinceId}`
    }

    const authHeader = getOAuthHeaders('GET', url)

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.warn(`[X Monitor] Failed to get tweets for user ${userId}: ${response.status}`, errorData)
      return []
    }

    const data = await response.json()
    const tweets: XTweet[] = []

    if (data.data && Array.isArray(data.data)) {
      // Get media URLs from includes
      const mediaMap = new Map<string, string>()
      if (data.includes?.media) {
        for (const media of data.includes.media) {
          if (media.media_key && (media.url || media.preview_image_url)) {
            mediaMap.set(media.media_key, media.url || media.preview_image_url)
          }
        }
      }

      for (const tweet of data.data) {
        const mediaUrls: string[] = []
        if (tweet.attachments?.media_keys) {
          for (const key of tweet.attachments.media_keys) {
            const url = mediaMap.get(key)
            if (url) {
              mediaUrls.push(url)
            }
          }
        }

        tweets.push({
          id: tweet.id,
          text: tweet.text,
          author_id: tweet.author_id,
          author_username: username, // Use provided username
          created_at: tweet.created_at,
          media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
          public_metrics: tweet.public_metrics
        })
      }
    }

    return tweets
  } catch (error: any) {
    console.warn(`[X Monitor] Error getting tweets for user ${userId}:`, error.message)
    return []
  }
}

/**
 * Get all monitored accounts (usernames only)
 */
export function getMonitoredAccounts(): readonly string[] {
  return MONITORED_ACCOUNTS
}

/**
 * Get user ID with caching (to avoid rate limits)
 * Free tier: 1 request / 24 hours per user for getUserByUsername
 * This function caches user IDs to avoid hitting rate limits
 */
export async function getCachedUserId(username: string): Promise<string | null> {
  // Check cache first
  if (userIdCache.has(username)) {
    return userIdCache.get(username) || null
  }

  // Fetch user ID (only once per 24 hours due to rate limits)
  // Note: In production, you might want to store user IDs in database
  const user = await getUserByUsername(username)
  if (user) {
    userIdCache.set(username, user.id)
    console.log(`[X Monitor] Cached user ID for ${username}: ${user.id}`)
    return user.id
  }

  console.warn(`[X Monitor] Could not get user ID for ${username}`)
  return null
}

