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

const WHALE_TWEET_HOOKS = [
  '🚨 Whale detected on-chain 🐋',
  '🐋 Massive crypto transfer spotted',
  '🧠 Smart money just moved again',
  '💰 Big wallet activity incoming',
  '⚡ Whale radar pinged live'
] as const

const WHALE_SPECULATION_HOOKS = [
  'Buying the dip?',
  'Major move loading?',
  'Rally signal?',
  'Accumulation phase?',
  'Smart money positioning?'
] as const

const KOTH_TWEET_HOOKS: Array<(token: TwitterToken) => string> = [
  token => `⚔️ $${formatTokenTag(token)} is storming the KOTH summit`,
  token => `🚀 KOTH radar pinged: $${formatTokenTag(token)} sprinting up the curve`,
  token => `🔥 Curve momentum popping for $${formatTokenTag(token)}`,
  token => `👀 Sniper watch: $${formatTokenTag(token)} closing in on the crown`,
  token => `⚡ Early signal: $${formatTokenTag(token)} heating up the bonding curve`
]

const KOTH_SPECULATION_HOOKS = [
  'Unlock incoming?',
  'Momentum building?',
  'Early entry signal?',
  'Whale accumulation?',
  'Breakout loading?'
] as const

export const NEWS_HOOK_WORDS = [
  'JUST IN',
  'BREAKING',
  'UPDATE',
  'CONFIRMED',
  'EXCLUSIVE',
  'LEAKED',
  'HAPPENING NOW',
  'EMERGENCY',
  'ALERT',
  'FLASH'
] as const

function pickRandom<T>(items: readonly T[]): T {
  if (!items.length) {
    throw new Error('Cannot pick a random item from an empty array')
  }
  const index = Math.floor(Math.random() * items.length)
  return items[index] ?? items[0]
}

function formatTokenTag(token: TwitterToken): string {
  if (token.symbol) {
    return token.symbol.toUpperCase()
  }
  if (token.name) {
    return token.name
  }
  if (token.address) {
    return shortAddress(token.address, 4)
  }
  return 'TOKEN'
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

/**
 * Format news post for Twitter
 * Format: "JUST IN: 🇺🇸 [title]" or "BREAKING: [title]"
 * No hashtags, US flag for US-related news
 * Quotes are wrapped in quotation marks
 */
export function formatNewsTweet(news: {
  title: string
  hook?: string
  isUSRelated: boolean
  link: string
}): string {
  const hook = news.hook || 'JUST IN'
  const flag = news.isUSRelated ? '🇺🇸 ' : ''
  
  // Clean title (remove existing hook if present, trim)
  let cleanTitle = news.title.trim()
  const upperTitle = cleanTitle.toUpperCase()
  
  // Remove hook from title if it's already there
  for (const h of NEWS_HOOK_WORDS) {
    if (upperTitle.startsWith(h)) {
      cleanTitle = cleanTitle.slice(h.length).trim()
      // Remove colon if present
      if (cleanTitle.startsWith(':')) {
        cleanTitle = cleanTitle.slice(1).trim()
      }
      break
    }
  }
  
  // Format quotes: if title contains quote-indicating words (says, said, etc.), it's a quote
  // Pattern: "Jim Cramer says lots of good elements" -> "Jim Cramer says "lots of good elements""
  // If no quote words, it's a normal post - just use the text as-is
  
  const quoteWords = /\b(says|said|states|stated|tells|told|claims|claimed|adds|added|notes|noted|explains|explained|warns|warned|predicts|predicted|suggests|suggested|argues|argued|believes|believed|thinks|thought|expects|expected|hopes|hoped|fears|feared|wants|wanted|needs|needed|demands|demanded|insists|insisted|maintains|maintained|asserts|asserted|declares|declared|announces|announced|reveals|revealed|confirms|confirmed|denies|denied|admits|admitted|acknowledges|acknowledged|recognizes|recognized|accepts|accepted|rejects|rejected|refuses|refused|agrees|agreed|disagrees|disagreed|approves|approved|disapproves|disapproved|supports|supported|opposes|opposed|endorses|endorsed|criticizes|criticized|praises|praised|condemns|condemned|blames|blamed|accuses|accused|charges|charged|alleges|alleged|sues|sued|files|filed|seeks|sought|requests|requested|asks|asked|urges|urged|calls|called)\b/i
  
  const hasQuotes = /["']/.test(cleanTitle)
  const isQuote = quoteWords.test(cleanTitle)
  
  // If it's a quote (has quote words) but no quotes in text, add quotes
  if (isQuote && !hasQuotes) {
    const quoteMatch = cleanTitle.match(/\b(says|said|states|stated|tells|told|claims|claimed|adds|added|notes|noted|explains|explained|warns|warned|predicts|predicted|suggests|suggested|argues|argued|believes|believed|thinks|thought|expects|expected|hopes|hoped|fears|feared|wants|wanted|needs|needed|demands|demanded|insists|insisted|maintains|maintained|asserts|asserted|declares|declared|announces|announced|reveals|revealed|confirms|confirmed|denies|denied|admits|admitted|acknowledges|acknowledged|recognizes|recognized|accepts|accepted|rejects|rejected|refuses|refused|agrees|agreed|disagrees|disagreed|approves|approved|disapproves|disapproved|supports|supported|opposes|opposed|endorses|endorsed|criticizes|criticized|praises|praised|condemns|condemned|blames|blamed|accuses|accused|charges|charged|alleges|alleged|sues|sued|files|filed|seeks|sought|requests|requested|asks|asked|urges|urged|calls|called)\s+(.+)/i)
    if (quoteMatch) {
      const beforeQuote = quoteMatch[1]
      const quoteText = quoteMatch[2].trim()
      // Wrap the quote text in quotes
      if (quoteText && !quoteText.startsWith('"') && !quoteText.startsWith("'")) {
        cleanTitle = `${beforeQuote} "${quoteText}"`
      }
    }
  }
  // If it's not a quote, just use the text as-is (no quotes needed)
  
  // Remove URLs from title (no links to external sites)
  cleanTitle = cleanTitle.replace(/(https?:\/\/[^\s]+|www\.[^\s]+|twitter\.com\/[^\s]+|x\.com\/[^\s]+|t\.co\/[^\s]+)/gi, '').trim()
  
  // Limit title length (Twitter limit is 280, reserve space for hook + flag)
  const maxTitleLength = 200
  if (cleanTitle.length > maxTitleLength) {
    cleanTitle = cleanTitle.slice(0, maxTitleLength - 3) + '...'
  }
  
  // Format: "JUST IN: 🇺🇸 [title]"
  return `${hook}: ${flag}${cleanTitle}`
}

export function formatWhaleTweet(event: WhaleEvent): string {
  // Format token symbol with $ prefix (e.g., $ETH, $USDT, $BTC)
  const tokenSymbol = event.token_symbol 
    ? `$${event.token_symbol.toUpperCase()}` 
    : event.token_name 
    ? `$${event.token_name.toUpperCase().slice(0, 6)}`
    : `$${shortAddress(event.token_address, 4)}`

  const valuePart = formatUsdCompact(event.amount_usd)

  // Action emoji and label based on event type
  let actionEmoji = '🐋'
  let actionLabel = 'BUY'
  if (event.event_type === 'sell') {
    actionEmoji = '🔴'
    actionLabel = 'SELL'
  } else if (event.event_type === 'transfer') {
    actionEmoji = '💸'
    actionLabel = 'TRANSFER'
  } else if (event.event_type === 'mint') {
    actionEmoji = '💰'
    actionLabel = 'MINT'
  } else if (event.event_type === 'burn') {
    actionEmoji = '🔥'
    actionLabel = 'BURN'
  }

  const sender = shortAddress(event.sender, 4)
  const receiver = shortAddress(event.receiver, 4)
  const movementLine = sender && receiver ? `From: ${sender} → ${receiver}` : ''

  // Link to our website instead of Etherscan
  const siteLink = 'cryptoflash.app/whale-alerts'

  // Speculation hook for engagement
  const speculation = pickRandom(WHALE_SPECULATION_HOOKS)

  // Hashtags - use token symbol if available
  const tokenHashtag = event.token_symbol ? `#${event.token_symbol.toUpperCase()}` : '#Crypto'
  const hashtags = `#Crypto #WhaleAlert ${tokenHashtag}`

  const hook = pickRandom(WHALE_TWEET_HOOKS)

  const lines = [
    hook,
    '',
    `${valuePart} whale just moved`,
    '',
    `Token: ${tokenSymbol}`,
    `Action: ${actionLabel} ${actionEmoji}`,
  ]

  if (movementLine) {
    lines.push(movementLine)
  }

  lines.push(
    '',
    `${speculation} 👀🔥`,
    '',
    `View on: ${siteLink}`,
    '',
    hashtags
  )

  return lines.join('\n')
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

  const progressLine = `Progress: ${progress.toFixed(1)}% • Score: ${score.toFixed(1)}`

  let secondaryLine: string | null = null
  if (typeof token.whaleUsd === 'number' && token.whaleUsd > 0) {
    const windowText = token.whaleWindow || 'last 1h'
    secondaryLine = `Whale flow: +${formatUsdCompact(token.whaleUsd)} (${windowText})`
  } else if (typeof token.priceUsd === 'number') {
    secondaryLine = `Price: $${token.priceUsd.toFixed(6)}`
  }

  const hook = pickRandom(KOTH_TWEET_HOOKS)(token)
  const speculation = pickRandom(KOTH_SPECULATION_HOOKS)

  const tokenTag = formatTokenTag(token)
  const siteLink = 'cryptoflash.app/dashboard'

  const lines = [
    hook,
    '',
    progressLine,
  ]

  if (secondaryLine) {
    lines.push(secondaryLine)
  }

  lines.push(
    '',
    `${speculation} 👀🔥`,
    '',
    `View on: ${siteLink}`,
    '',
    '#KOTH #Solana #CryptoFlash'
  )

  return lines.join('\n')
}

/**
 * Upload video to Twitter using chunked upload (INIT → APPEND → FINALIZE)
 * Returns media_id if successful
 */
async function uploadVideo(
  videoUrl: string,
  oauth: OAuth,
  token: { key: string; secret: string }
): Promise<string | null> {
  try {
    console.log('[Twitter Video] Starting video download:', videoUrl)
    
    // Download video
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoFlash Video Downloader)'
      }
    })
    
    if (!videoResponse.ok) {
      console.warn(`[Twitter Video] Failed to download video: ${videoResponse.status}`)
      return null
    }
    
    const videoBuffer = await videoResponse.arrayBuffer()
    const videoSize = videoBuffer.byteLength
    
    console.log(`[Twitter Video] Downloaded ${videoSize} bytes`)
    
    // Step 1: INIT - Initialize upload
    const initUrl = 'https://upload.twitter.com/1.1/media/upload.json'
    const initParams = new URLSearchParams({
      command: 'INIT',
      media_type: 'video/mp4',
      total_bytes: videoSize.toString()
    })
    
    const initRequestData = {
      url: `${initUrl}?${initParams.toString()}`,
      method: 'POST'
    }
    
    const initAuthHeader = oauth.toHeader(oauth.authorize(initRequestData, token))
    const initResponse = await fetch(`${initUrl}?${initParams.toString()}`, {
      method: 'POST',
      headers: {
        'Authorization': initAuthHeader.Authorization
      }
    })
    
    if (!initResponse.ok) {
      const errorData = await initResponse.json().catch(() => ({}))
      console.error('[Twitter Video] INIT failed:', initResponse.status, errorData)
      return null
    }
    
    const initData = await initResponse.json()
    const mediaId = initData.media_id_string
    
    if (!mediaId) {
      console.error('[Twitter Video] No media_id from INIT')
      return null
    }
    
    console.log(`[Twitter Video] INIT successful, media_id: ${mediaId}`)
    
    // Step 2: APPEND - Upload video in chunks (5MB chunks)
    const chunkSize = 5 * 1024 * 1024 // 5MB
    const chunks = Math.ceil(videoSize / chunkSize)
    
    for (let segmentIndex = 0; segmentIndex < chunks; segmentIndex++) {
      const start = segmentIndex * chunkSize
      const end = Math.min(start + chunkSize, videoSize)
      const chunk = videoBuffer.slice(start, end)
      const chunkBase64 = Buffer.from(chunk).toString('base64')
      
      const appendParams = new URLSearchParams({
        command: 'APPEND',
        media_id: mediaId,
        segment_index: segmentIndex.toString()
      })
      
      const appendRequestData = {
        url: `${initUrl}?${appendParams.toString()}`,
        method: 'POST'
      }
      
      const appendAuthHeader = oauth.toHeader(oauth.authorize(appendRequestData, token))
      
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2)
      const formDataBody = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="media"',
        '',
        chunkBase64,
        `--${boundary}--`
      ].join('\r\n')
      
      const appendResponse = await fetch(`${initUrl}?${appendParams.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': appendAuthHeader.Authorization,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: formDataBody
      })
      
      if (!appendResponse.ok) {
        const errorData = await appendResponse.json().catch(() => ({}))
        console.error(`[Twitter Video] APPEND chunk ${segmentIndex} failed:`, appendResponse.status, errorData)
        return null
      }
      
      console.log(`[Twitter Video] APPEND chunk ${segmentIndex + 1}/${chunks} successful`)
    }
    
    // Step 3: FINALIZE - Finalize upload
    const finalizeParams = new URLSearchParams({
      command: 'FINALIZE',
      media_id: mediaId
    })
    
    const finalizeRequestData = {
      url: `${initUrl}?${finalizeParams.toString()}`,
      method: 'POST'
    }
    
    const finalizeAuthHeader = oauth.toHeader(oauth.authorize(finalizeRequestData, token))
    const finalizeResponse = await fetch(`${initUrl}?${finalizeParams.toString()}`, {
      method: 'POST',
      headers: {
        'Authorization': finalizeAuthHeader.Authorization
      }
    })
    
    if (!finalizeResponse.ok) {
      const errorData = await finalizeResponse.json().catch(() => ({}))
      console.error('[Twitter Video] FINALIZE failed:', finalizeResponse.status, errorData)
      return null
    }
    
    const finalizeData = await finalizeResponse.json()
    
    // Wait for processing if needed
    if (finalizeData.processing_info) {
      const processingInfo = finalizeData.processing_info
      let checkAfter = processingInfo.check_after_secs || 5
      
      while (processingInfo.state === 'pending' || processingInfo.state === 'in_progress') {
        console.log(`[Twitter Video] Processing video, waiting ${checkAfter}s...`)
        await new Promise(resolve => setTimeout(resolve, checkAfter * 1000))
        
        const statusParams = new URLSearchParams({
          command: 'STATUS',
          media_id: mediaId
        })
        
        const statusRequestData = {
          url: `${initUrl}?${statusParams.toString()}`,
          method: 'GET'
        }
        
        const statusAuthHeader = oauth.toHeader(oauth.authorize(statusRequestData, token))
        const statusResponse = await fetch(`${initUrl}?${statusParams.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': statusAuthHeader.Authorization
          }
        })
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.processing_info) {
            Object.assign(processingInfo, statusData.processing_info)
            checkAfter = processingInfo.check_after_secs || 5
          }
        } else {
          break // Exit loop if status check fails
        }
      }
      
      if (processingInfo.state === 'failed') {
        console.error('[Twitter Video] Video processing failed')
        return null
      }
    }
    
    console.log(`[Twitter Video] Upload successful, media_id: ${mediaId}`)
    return mediaId
  } catch (error: any) {
    console.error('[Twitter Video] Error uploading video:', error.message)
    return null
  }
}

/**
 * Upload image to Twitter
 * Returns media_id if successful
 */
async function uploadMedia(imageUrl: string, oauth: OAuth, token: { key: string; secret: string }): Promise<string | null> {
  try {
    // Download image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoFlash Media Downloader)'
      }
    })
    
    if (!imageResponse.ok) {
      console.warn(`[Twitter Media] Failed to download image: ${imageResponse.status}`)
      return null
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    
    // Upload to Twitter Media API (v1.1) - requires multipart/form-data
    const mediaUrl = 'https://upload.twitter.com/1.1/media/upload.json'
    
    // Build form data manually for OAuth signing
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2)
    const formDataBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="media_data"',
      '',
      imageBase64,
      `--${boundary}--`
    ].join('\r\n')
    
    const requestData = {
      url: mediaUrl,
      method: 'POST'
    }
    
    const authHeader = oauth.toHeader(oauth.authorize(requestData, token))
    
    const uploadResponse = await fetch(mediaUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader.Authorization,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: formDataBody
    })
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}))
      console.error('[Twitter Media] Upload failed:', uploadResponse.status, errorData)
      return null
    }
    
    const uploadData = await uploadResponse.json()
    return uploadData.media_id_string || null
  } catch (error: any) {
    console.error('[Twitter Media] Error uploading:', error.message)
    return null
  }
}

/**
 * Check if image has watermark by analyzing image metadata and common watermark patterns
 * This is a simple heuristic - not 100% accurate but should catch most watermarks
 */
async function hasWatermark(imageUrl: string): Promise<boolean> {
  try {
    // Download image to check
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoFlash Watermark Checker)'
      }
    })
    
    if (!response.ok) return true // If we can't download, assume it has watermark to be safe
    
    // Check URL for common watermark indicators
    const urlLower = imageUrl.toLowerCase()
    const watermarkIndicators = [
      'watermark',
      'wm',
      'getty',
      'shutterstock',
      'istock',
      'adobe',
      'dreamstime',
      'alamy',
      'fotolia',
      'depositphotos',
      '123rf',
      'bigstock',
      'canstock',
      'featurepics',
      'thinkstock',
      'jupiterimages',
      'corbis',
      'agefotostock',
      'westend61',
      'mauritius',
      'imagebroker',
      'imagebroker.net',
      'age',
      'agefoto',
      'imagebroker',
      'imagebroker.net',
      'age',
      'agefoto',
      'imagebroker',
      'imagebroker.net'
    ]
    
    for (const indicator of watermarkIndicators) {
      if (urlLower.includes(indicator)) {
        console.log(`[Watermark Check] Detected watermark indicator in URL: ${indicator}`)
        return true
      }
    }
    
    // For now, we'll do a simple check - if image is from known stock photo sites, assume watermark
    // In production, you might want to use image analysis libraries, but that's complex
    return false
  } catch (error) {
    console.warn('[Watermark Check] Error checking watermark:', error)
    return true // If we can't check, assume it has watermark to be safe
  }
}

/**
 * Post a tweet to Twitter/X using API v2
 * Requires OAuth 1.0a User Context (not Bearer Token)
 * Supports optional image or video upload (priority: video > image > text only)
 */
export async function postTweet(
  text: string, 
  imageUrl?: string | null,
  videoUrl?: string | null
): Promise<TwitterPostResponse | { rateLimited: true; resetAt: number | null } | null> {
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

    // Upload media (priority: video > image > text only)
    let mediaId: string | null = null
    if (videoUrl) {
      // Priority 1: Upload video if available
      console.log('[Twitter Post] Uploading video...')
      mediaId = await uploadVideo(videoUrl, oauth, token)
      if (mediaId) {
        console.log('[Twitter Post] Video uploaded successfully:', mediaId)
      } else {
        console.warn('[Twitter Post] Video upload failed, falling back to image if available')
      }
    }
    
    if (!mediaId && imageUrl) {
      // Priority 2: Upload image if no video or video failed
      // Check for watermark before uploading
      const hasWm = await hasWatermark(imageUrl)
      if (hasWm) {
        console.log('[Twitter Post] Skipping image upload - watermark detected')
      } else {
        console.log('[Twitter Post] Uploading image...')
        mediaId = await uploadMedia(imageUrl, oauth, token)
        if (mediaId) {
          console.log('[Twitter Post] Image uploaded successfully:', mediaId)
        } else {
          console.warn('[Twitter Post] Failed to upload image, posting without media')
        }
      }
    }

    const url = 'https://api.twitter.com/2/tweets'
    const requestData = {
      url,
      method: 'POST'
    }

    // Generate OAuth 1.0a authorization header
    const authHeader = oauth.toHeader(oauth.authorize(requestData, token))

    // Build tweet payload
    const tweetPayload: { text: string; media?: { media_ids: string[] } } = {
      text: text.substring(0, 280) // Twitter limit is 280 characters
    }
    
    if (mediaId) {
      tweetPayload.media = { media_ids: [mediaId] }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader.Authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetPayload)
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

