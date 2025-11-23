import { WhaleEvent } from './types'
import { NEWS_HOOK_WORDS } from './api/twitter'

const SIDE_CONFIG: Record<string, { label: string; color: number; emoji: string }> = {
  buy: { label: 'BUY', color: 0x3b82f6, emoji: '🟢' },
  sell: { label: 'SELL', color: 0xef4444, emoji: '🔴' },
  transfer: { label: 'TRANSFER', color: 0x10b981, emoji: '📦' },
  mint: { label: 'MINT', color: 0xf97316, emoji: '🪙' },
  burn: { label: 'BURN', color: 0xfacc15, emoji: '🔥' },
  exchange: { label: 'EXCHANGE', color: 0x8b5cf6, emoji: '🔁' }
}

const FALLBACK_SIDE = { label: 'TRANSFER', color: 0x0ea5e9, emoji: '🐋' }

function pickSide(eventType?: string | null) {
  if (!eventType) return FALLBACK_SIDE
  return SIDE_CONFIG[eventType.toLowerCase()] ?? FALLBACK_SIDE
}

function formatUsd(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatTokens(amount?: number | null) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '—'
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })
}
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || ''
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || ''
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ''
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID || ''
const DISCORD_WHALE_ROLE_ID = process.env.DISCORD_WHALE_ROLE_ID || ''
const DISCORD_ALERT_CHANNEL_ID = process.env.DISCORD_ALERT_CHANNEL_ID || ''
const DISCORD_KOTH_CHANNEL_ID = process.env.DISCORD_KOTH_CHANNEL_ID || ''
const DISCORD_NEWS_CHANNEL_ID = process.env.DISCORD_NEWS_CHANNEL_ID || ''

interface DiscordMessageResponse {
  id?: string | null
}

interface DiscordTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

export function getDiscordAuthorizeUrl(state: string) {
  const encodedScopes = encodeURIComponent('identify guilds.join')
  return `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=code&scope=${encodedScopes}&state=${state}&redirect_uri=${encodeURIComponent(getDiscordRedirectUri())}`
}

export function getDiscordRedirectUri() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl.replace(/\/$/, '')}/api/whales/discord/callback`
}

export async function exchangeDiscordCode(code: string) {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: getDiscordRedirectUri(),
  })

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to exchange Discord code: ${response.status} ${text}`)
  }

  return (await response.json()) as DiscordTokenResponse
}

export async function refreshDiscordToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to refresh Discord token: ${response.status} ${text}`)
  }

  return (await response.json()) as DiscordTokenResponse
}

export async function getDiscordUser(accessToken: string) {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch Discord user: ${response.status} ${text}`)
  }

  return (await response.json()) as { id: string; username: string; discriminator: string }
}

export async function addUserToGuild(userId: string, accessToken: string) {
  if (!DISCORD_SERVER_ID) {
    throw new Error('DISCORD_SERVER_ID not configured')
  }

  const response = await fetch(`https://discord.com/api/guilds/${DISCORD_SERVER_ID}/members/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    },
    body: JSON.stringify({
      access_token: accessToken,
      roles: DISCORD_WHALE_ROLE_ID ? [DISCORD_WHALE_ROLE_ID] : undefined,
    }),
  })

  if (!response.ok && response.status !== 204) {
    const text = await response.text()
    throw new Error(`Failed to add user to guild: ${response.status} ${text}`)
  }
}

export async function removeUserRole(userId: string) {
  if (!DISCORD_SERVER_ID || !DISCORD_WHALE_ROLE_ID) {
    return
  }

  const response = await fetch(`https://discord.com/api/guilds/${DISCORD_SERVER_ID}/members/${userId}/roles/${DISCORD_WHALE_ROLE_ID}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    },
  })

  if (!response.ok && response.status !== 204) {
    const text = await response.text()
    throw new Error(`Failed to remove user role: ${response.status} ${text}`)
  }
}

/**
 * Add reactions to a Discord message
 */
async function addReactions(channelId: string, messageId: string, emojis: string[]): Promise<void> {
  if (!DISCORD_BOT_TOKEN) return

  for (const emoji of emojis) {
    try {
      const response = await fetch(
        `https://discord.com/api/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          },
        }
      )

      if (!response.ok && response.status !== 204) {
        console.warn(`[Discord] Failed to add reaction ${emoji}: ${response.status}`)
      }

      // Small delay between reactions to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 250))
    } catch (error) {
      console.warn(`[Discord] Error adding reaction ${emoji}:`, error)
    }
  }
}

export async function sendWhaleEventToDiscord(event: WhaleEvent): Promise<DiscordMessageResponse | null> {
  if (!DISCORD_ALERT_CHANNEL_ID) {
    console.warn('[Discord] DISCORD_ALERT_CHANNEL_ID not configured; skipping whale alert.')
    return null
  }
  if (!DISCORD_BOT_TOKEN) {
    console.warn('[Discord] DISCORD_BOT_TOKEN not configured; skipping whale alert.')
    return null
  }

  const side = pickSide(event.event_type)
  const amountUsdText = formatUsd(event.amount_usd)
  const amountTokenText = formatTokens(event.amount_tokens)

  // Enhanced title with better formatting
  const tokenDisplay = event.token_symbol || event.token_name || 'Unknown'
  const title = `${side.emoji} ${tokenDisplay} Whale Alert ${side.emoji}`

  // Enhanced description with better structure
  const descriptionLines = [
    `**💰 Value:** ${amountUsdText}`,
    `**📊 Amount:** ${amountTokenText} ${event.token_symbol || ''}`.trim(),
    event.chain ? `**⛓️ Chain:** ${event.chain}` : null,
    event.token_symbol && event.token_name ? `**🪙 Token:** ${event.token_symbol} · ${event.token_name}` : null
  ].filter(Boolean)

  // Enhanced embed with better colors and structure
  const embed = {
    title,
    description: descriptionLines.join('\n'),
    color: side.color,
    fields: [
      {
        name: '📋 Event Type',
        value: `**${side.label}**`,
        inline: true,
      },
      event.block_time
        ? {
            name: '⏰ Time',
            value: `<t:${Math.floor(new Date(event.block_time).getTime() / 1000)}:R>`,
            inline: true,
          }
        : null,
      event.sender && event.receiver
        ? {
            name: '🔄 Flow',
            value: `\`${event.sender.slice(0, 6)}...${event.sender.slice(-4)}\` → \`${event.receiver.slice(0, 6)}...${event.receiver.slice(-4)}\``,
            inline: false,
          }
        : null,
      event.tx_url && event.tx_hash
        ? {
            name: '🔗 Transaction',
            value: `[View on Explorer](${event.tx_url})`,
            inline: false,
          }
        : null,
    ].filter(Boolean),
    footer: {
      text: '🐋 CryptoFlash Whale Alerts • Real-time on-chain intelligence',
      icon_url: 'https://cryptoflash.app/favicon.ico',
    },
    timestamp: event.block_time ? new Date(event.block_time).toISOString() : undefined,
  }

  const payload = {
    embeds: [embed],
  }

  const response = await fetch(`https://discord.com/api/channels/${DISCORD_ALERT_CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('[Discord] Failed to send whale alert:', response.status, text)
    return null
  }

  try {
    const result = await response.json()
    
    // Add automatic reactions
    if (result.id) {
      await addReactions(DISCORD_ALERT_CHANNEL_ID, result.id, ['🐋', '🔥', '💎'])
    }
    
    return result
  } catch {
    return { id: null }
  }
}

function formatPercent(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return `${value.toFixed(1)}%`
}

function formatTinyUsd(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(6)}`
}

function formatSolAmount(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return `${value.toFixed(2)} SOL`
}

function formatCurveSpeed(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return `${value.toFixed(1)}/10`
}

function formatWhaleInflows(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value.toFixed(2)
}

export interface KothWatcherInfo {
  displayName: string
  alertType: string
  threshold: number
}

interface KothTokenPayload {
  tokenAddress: string
  name: string
  symbol: string
  score?: number
  progress?: number
  priceUsd?: number
  liquidity?: number
  volume24h?: number
  curveSpeed?: number
  whaleCount?: number
  whaleInflows?: number
}

export async function sendKothAlertToDiscord(token: KothTokenPayload, watchers: KothWatcherInfo[]): Promise<DiscordMessageResponse | null> {
  if (!DISCORD_KOTH_CHANNEL_ID) {
    console.warn('[Discord] DISCORD_KOTH_CHANNEL_ID not configured; skipping KOTH alert.')
    return null
  }
  if (!DISCORD_BOT_TOKEN) {
    console.warn('[Discord] DISCORD_BOT_TOKEN not configured; skipping KOTH alert.')
    return null
  }

  if (!watchers.length) {
    return null
  }

  const previewLines = watchers.slice(0, 12).map(watcher => {
    const label = watcher.alertType === 'progress' ? 'Progress ≥' : 'Score ≥'
    return `• ${watcher.displayName} · ${label} ${watcher.threshold.toFixed(1)}`
  })

  if (watchers.length > 12) {
    previewLines.push(`• …and ${watchers.length - 12} more watchers`)
  }

  const watchersPreview = previewLines.join('\n')

  const pumpFunUrl = `https://pump.fun/coin/${token.tokenAddress}`

  const liquidityText = formatSolAmount(token.liquidity)
  const volumeText = formatSolAmount(token.volume24h)
  const curveSpeedText = formatCurveSpeed(token.curveSpeed)
  const inflowsText = formatWhaleInflows(token.whaleInflows)
  const whalesFieldValue =
    token.whaleCount && token.whaleCount > 0
      ? `${token.whaleCount}${inflowsText ? ` (infl. ${inflowsText} SOL)` : ''}`
      : null

  // Enhanced embed with better structure
  const embed = {
    title: `🏆 ${token.name} (${token.symbol}) KOTH Alert`,
    description: [
      `**📊 Score:** ${token.score !== undefined ? `**${token.score.toFixed(1)}/100**` : '—'}`,
      `**📈 Progress:** ${formatPercent(token.progress)}`,
      `**💵 Price:** ${formatTinyUsd(token.priceUsd)}`
    ].join('\n'),
    color: 0xf97316, // Orange for KOTH
    fields: [
      liquidityText
        ? {
            name: '💧 Liquidity',
            value: `**${liquidityText}**`,
            inline: true
          }
        : null,
      volumeText
        ? {
            name: '📊 24h Volume',
            value: `**${volumeText}**`,
            inline: true
          }
        : null,
      curveSpeedText
        ? {
            name: '⚡ Curve Speed',
            value: `**${curveSpeedText}**`,
            inline: true
          }
        : null,
      whalesFieldValue
        ? {
            name: '🐋 Whales',
            value: `**${whalesFieldValue}**`,
            inline: true
          }
        : null,
      {
        name: '👀 Watchers',
        value: watchersPreview || '—',
        inline: false
      },
      {
        name: '🔗 Links',
        value: `[View on Pump.fun](${pumpFunUrl}) • [Track on CryptoFlash](https://cryptoflash.app/dashboard)`,
        inline: false
      }
    ].filter(Boolean),
    footer: {
      text: '⚔️ CryptoFlash KOTH Tracker • Real-time bonding curve intelligence',
      icon_url: 'https://cryptoflash.app/favicon.ico',
    },
    timestamp: new Date().toISOString(),
  }

  const payload = {
    embeds: [embed]
  }

  // Retry logic with exponential backoff for rate limiting
  let retries = 0
  const maxRetries = 3
  let lastError: any = null

  while (retries <= maxRetries) {
    const response = await fetch(`https://discord.com/api/channels/${DISCORD_KOTH_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`
      },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      try {
        const result = await response.json()
        
        // Add automatic reactions (with delay to avoid rate limits)
        if (result.id) {
          // Small delay before adding reactions
          await new Promise(resolve => setTimeout(resolve, 500))
          await addReactions(DISCORD_KOTH_CHANNEL_ID, result.id, ['🏆', '🔥', '⚔️'])
        }
        
        return result
      } catch {
        return { id: null }
      }
    }

    // Handle rate limiting (429)
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}))
      const retryAfter = errorData.retry_after ? Math.ceil(errorData.retry_after * 1000) : (retries + 1) * 1000
      
      console.warn(`[Discord] Rate limited (429) for KOTH alert. Retry after ${retryAfter}ms (attempt ${retries + 1}/${maxRetries})`)
      
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryAfter))
        retries++
        continue
      } else {
        lastError = { status: 429, message: 'Rate limited', retry_after: retryAfter }
        break
      }
    }

    // Other errors
    const text = await response.text()
    console.error('[Discord] Failed to send KOTH alert:', response.status, text)
    lastError = { status: response.status, message: text }
    break
  }

  // If we exhausted retries, log and return null
  if (lastError) {
    console.error('[Discord] Failed to send KOTH alert after retries:', lastError)
  }
  
  return null
}

/**
 * Create a thread in a Discord channel
 */
async function createThread(channelId: string, messageId: string, threadName: string): Promise<string | null> {
  if (!DISCORD_BOT_TOKEN) return null

  try {
    const response = await fetch(
      `https://discord.com/api/channels/${channelId}/messages/${messageId}/threads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
        body: JSON.stringify({
          name: threadName,
          auto_archive_duration: 1440, // 24 hours
        }),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      console.warn(`[Discord] Failed to create thread: ${response.status} ${text}`)
      return null
    }

    const result = await response.json()
    return result.id || null
  } catch (error) {
    console.warn('[Discord] Error creating thread:', error)
    return null
  }
}

/**
 * Send news post to Discord
 * Formats news as embed with image/video if available
 * Creates a thread for discussion
 */
export async function sendNewsToDiscord(news: {
  title: string
  hook?: string | null
  isUSRelated: boolean
  link: string
  imageUrl?: string | null
  videoUrl?: string | null
  source?: string
}): Promise<DiscordMessageResponse | null> {
  if (!DISCORD_NEWS_CHANNEL_ID) {
    console.warn('[Discord] DISCORD_NEWS_CHANNEL_ID not configured; skipping news post.')
    return null
  }

  if (!DISCORD_BOT_TOKEN) {
    console.warn('[Discord] DISCORD_BOT_TOKEN not configured; skipping news post.')
    return null
  }

  // Validate channel ID format (Discord channel IDs are 17-19 digit numbers)
  if (!/^\d{17,19}$/.test(DISCORD_NEWS_CHANNEL_ID)) {
    console.error(`[Discord] Invalid DISCORD_NEWS_CHANNEL_ID format: ${DISCORD_NEWS_CHANNEL_ID}. Expected 17-19 digit number.`)
    return null
  }

  try {
    // Format title with hook (but check if hook already exists to avoid duplication)
    let title = news.title.trim()
    
    // Check if title already has a hook (to avoid duplication like "JUST IN: 🇺🇸 JUST IN: 🇺🇸 ...")
    const upperTitle = title.toUpperCase()
    const hasExistingHook = NEWS_HOOK_WORDS.some(hook => upperTitle.startsWith(hook))
    
    if (!hasExistingHook && news.hook) {
      // Only add hook if it doesn't already exist
      const flag = news.isUSRelated ? '🇺🇸 ' : ''
      title = `${news.hook}: ${flag}${title}`
    } else if (!hasExistingHook && news.isUSRelated) {
      // Only add flag if no hook exists
      title = `🇺🇸 ${title}`
    }
    // If hook already exists, use title as-is

    // Determine color based on hook
    let color = 0x10b981 // Default green
    if (news.hook === 'BREAKING') {
      color = 0xef4444 // Red for breaking
    } else if (news.hook === 'JUST IN') {
      color = 0x3b82f6 // Blue for just in
    }

    // Create enhanced embed
    const embed: any = {
      title: title.length > 256 ? title.substring(0, 253) + '...' : title,
      description: news.link ? `[📰 Read full article](${news.link})` : undefined,
      color,
      fields: news.source
        ? [
            {
              name: '📡 Source',
              value: news.source,
              inline: true,
            },
          ]
        : [],
      timestamp: new Date().toISOString(),
      footer: {
        text: '📰 CryptoFlash Breaking News • Stay informed, stay ahead',
        icon_url: 'https://cryptoflash.app/favicon.ico',
      },
    }

    // Add image or video thumbnail
    if (news.videoUrl) {
      embed.image = { url: news.videoUrl }
    } else if (news.imageUrl) {
      embed.image = { url: news.imageUrl }
    }

    const payload = {
      embeds: [embed],
    }

    const response = await fetch(`https://discord.com/api/channels/${DISCORD_NEWS_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      const errorData = JSON.parse(text).catch(() => ({}))
      
      if (response.status === 404) {
        console.error(`[Discord] Channel not found (404): DISCORD_NEWS_CHANNEL_ID=${DISCORD_NEWS_CHANNEL_ID}. Please check if the channel exists and the bot has access to it.`, errorData)
      } else {
        console.error('[Discord] Failed to send news post:', response.status, text)
      }
      return null
    }

    try {
      const result = await response.json()
      console.log('[Discord] Posted news to Discord:', result.id)

      // Create thread for discussion (thread name max 100 chars)
      const threadName = news.title.length > 90 ? news.title.substring(0, 87) + '...' : news.title
      const threadId = await createThread(DISCORD_NEWS_CHANNEL_ID, result.id, threadName)
      if (threadId) {
        console.log('[Discord] Created thread for news:', threadId)
      }

      // Add automatic reactions
      if (result.id) {
        await addReactions(DISCORD_NEWS_CHANNEL_ID, result.id, ['📰', '🔥', '💬'])
      }

      return result
    } catch {
      return { id: null }
    }
  } catch (error: any) {
    console.error('[Discord] Error sending news post:', error.message)
    return null
  }
}

