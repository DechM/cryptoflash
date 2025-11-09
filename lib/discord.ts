import { WhaleEvent } from './types'

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

export async function sendWhaleEventToDiscord(event: WhaleEvent) {
  if (!DISCORD_ALERT_CHANNEL_ID || !DISCORD_BOT_TOKEN) {
    return
  }

  const embed = {
    title: `${event.token_symbol || event.token_name || 'Unknown'} Whale Alert`,
    description: `**Amount:** ${formatTokens(event.amount_tokens)} tokens\n**Value:** ${formatUsd(event.amount_usd)}${
      event.chain ? `\n**Chain:** ${event.chain}` : ''
    }`,
    color: 0x00ffa3,
    fields: [
      {
        name: 'Event',
        value: `${event.event_type || 'transfer'}`.toUpperCase(),
        inline: true,
      },
      event.block_time
        ? {
            name: 'Time',
            value: `<t:${Math.floor(new Date(event.block_time).getTime() / 1000)}:R>`,
            inline: true,
          }
        : null,
      event.tx_url && event.tx_hash
        ? {
            name: 'Transaction',
            value: `[View Explorer](${event.tx_url})`,
          }
        : null,
      event.sender && event.receiver
        ? {
            name: 'Flow',
            value: `${event.sender.slice(0, 4)}... → ${event.receiver.slice(-4)}`,
            inline: true,
          }
        : null,
    ].filter(Boolean),
    footer: {
      text: 'CryptoFlash Whale Alerts',
    },
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
  }
}
