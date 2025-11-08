import { refreshDiscordToken, addUserToGuild, removeUserRole } from '@/lib/discord'
import { supabaseAdmin } from '@/lib/supabase'
import { DiscordLink, WhaleSubscriber } from '@/lib/types'
import { getDiscordLinkRecord, upsertWhaleSubscription } from '@/lib/whales'

const DEFAULT_PLAN_NAME = process.env.WHALE_PLAN_ID || 'whale-standard'
const DEFAULT_DURATION_DAYS = Number(process.env.WHALE_PLAN_DURATION_DAYS || '30')

function addDays(base: Date, days: number) {
  const result = new Date(base)
  result.setDate(result.getDate() + days)
  return result
}

async function ensureDiscordRole(link: DiscordLink) {
  if (!link.discord_user_id) {
    return
  }

  let accessToken = link.access_token || undefined
  const tokenExpired =
    link.token_expires_at && new Date(link.token_expires_at).getTime() <= Date.now()

  if ((!accessToken || tokenExpired) && link.refresh_token) {
    try {
      const refreshed = await refreshDiscordToken(link.refresh_token)
      accessToken = refreshed.access_token

      const tokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()

      await supabaseAdmin
        .from('discord_links')
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token ?? link.refresh_token,
          token_expires_at: tokenExpiresAt,
          scope: refreshed.scope ?? link.scope,
        })
        .eq('user_id', link.user_id)
    } catch (error) {
      console.warn('[Whale Subscription] Failed to refresh Discord token', error)
      return
    }
  }

  if (!accessToken) {
    console.warn('[Whale Subscription] Missing Discord access token for user', link.user_id)
    return
  }

  try {
    await addUserToGuild(link.discord_user_id, accessToken)
  } catch (error) {
    console.warn('[Whale Subscription] Failed to add user to Discord guild', error)
  }
}

export async function activateWhaleSubscription(
  userId: string,
  {
    plan = DEFAULT_PLAN_NAME,
    durationDays = DEFAULT_DURATION_DAYS,
  }: { plan?: string; durationDays?: number } = {}
) {
  const now = new Date()

  const { data: existing } = await supabaseAdmin
    .from('whale_subscribers')
    .select('expires_at, status')
    .eq('user_id', userId)
    .maybeSingle()

  let baseDate = now
  if (existing?.expires_at) {
    const existingExpiry = new Date(existing.expires_at)
    if (existingExpiry > now) {
      baseDate = existingExpiry
    }
  }

  const newExpiry = addDays(baseDate, durationDays)

  await upsertWhaleSubscription(userId, {
    status: 'active',
    plan,
    started_at: now.toISOString(),
    expires_at: newExpiry.toISOString(),
    cancel_at: null as unknown as string | undefined,
  } as Partial<WhaleSubscriber>)

  const link = await getDiscordLinkRecord(userId)
  if (link) {
    await ensureDiscordRole(link as DiscordLink)
  }

  return newExpiry
}

export async function deactivateWhaleSubscription(
  userId: string,
  reason: 'expired' | 'canceled' = 'expired'
) {
  await upsertWhaleSubscription(userId, {
    status: reason === 'canceled' ? 'canceled' : 'inactive',
  })

  const link = await getDiscordLinkRecord(userId)
  if (link?.discord_user_id) {
    try {
      await removeUserRole(link.discord_user_id)
    } catch (error) {
      console.warn('[Whale Subscription] Failed to remove Discord role', error)
    }
  }
}

export async function expireStaleWhaleSubscriptions() {
  const { data, error } = await supabaseAdmin
    .from('whale_subscribers')
    .select('user_id, expires_at')
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
    .limit(100)

  if (error) {
    console.error('[Whale Subscription] Failed to fetch expired subscriptions', error)
    throw error
  }

  if (!data || !data.length) {
    return { count: 0 }
  }

  for (const row of data) {
    await deactivateWhaleSubscription(row.user_id, 'expired')
  }

  return { count: data.length }
}


