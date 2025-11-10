import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLimit, getUserPlan } from '@/lib/plan'
import { sendKothAlertToDiscord } from '@/lib/discord'
import { recordCronFailure, recordCronSuccess } from '@/lib/cron'

async function runAlertsJob() {
  try {
    // Get latest KOTH tokens from internal API
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const kothResponse = await fetch(`${baseUrl}/api/koth-data`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (!kothResponse.ok) {
      const message = `Failed to fetch KOTH data (${kothResponse.status})`
      await recordCronFailure('alerts:send', message)
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const { tokens } = await kothResponse.json()

    if (!tokens || tokens.length === 0) {
      await recordCronSuccess('alerts:send', {
        sentCount: 0,
        reason: 'no-tokens'
      })
      return NextResponse.json({ message: 'No tokens to check' })
    }

    // Get all active alerts
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from('user_alerts')
      .select('*')
      .eq('is_active', true)

    if (alertsError || !alerts) {
      console.error('Error fetching alerts:', alertsError)
      await recordCronFailure('alerts:send', alertsError || 'Failed to fetch alerts')
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    const sentAlerts: string[] = []
    const tokenWatchers = new Map<
      string,
      {
        token: any
        watchers: Array<{
          alert: (typeof alerts)[number]
          userId: string
          threshold: number
          alertType: string
          displayName: string
          discordUsername?: string | null
        }>
      }
    >()

    const userCache = new Map<
      string,
      {
        email: string | null
        discordUsername: string | null
        discordLinked: boolean
      }
    >()

    // Check each alert against tokens
    for (const alert of alerts) {
      const plan = await getUserPlan(alert.user_id)
      const threshold = alert.threshold_value || (getLimit(plan, 'alerts.threshold_min') as number)
      const maxDaily = getLimit(plan, 'alerts.max_per_day') as number

      // Check daily limit
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: todayCount } = await supabaseAdmin
        .from('alert_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', alert.user_id)
        .gte('sent_at', today.toISOString())

      if ((todayCount || 0) >= maxDaily) {
        continue // Skip if daily limit reached
      }

      // Find matching tokens
      const matchingTokens = tokens.filter((token: any) => {
        // Check if token matches alert criteria
        if (alert.token_address && token.tokenAddress !== alert.token_address) {
          return false
        }

        // Check threshold based on alert type
        switch (alert.alert_type) {
          case 'score':
            return token.score >= threshold
          case 'progress':
            return token.progress >= threshold
          default:
            return token.score >= threshold
        }
      })

      const thresholdLabel = `${alert.alert_type === 'progress' ? 'Progress' : 'Score'} alert >= ${threshold}`

      // Send alerts for matching tokens
      for (const token of matchingTokens) {
        let userRecord = userCache.get(alert.user_id)
        if (!userRecord) {
          const [{ data: discordData }, { data: userData }] = await Promise.all([
            supabaseAdmin
              .from('discord_links')
              .select('discord_username, discord_user_id')
              .eq('user_id', alert.user_id)
              .maybeSingle(),
            supabaseAdmin
              .from('users')
              .select('email')
              .eq('id', alert.user_id)
              .maybeSingle()
          ])

          userRecord = {
            email: userData?.email ?? null,
            discordUsername: discordData?.discord_username ?? null,
            discordLinked: Boolean(discordData?.discord_user_id)
          }
          userCache.set(alert.user_id, userRecord)
        }

        if (!userRecord.discordLinked) {
          continue
        }

        const displayName =
          userRecord.discordUsername ||
          (userRecord.email ? userRecord.email.split('@')[0] : 'Watcher') ||
          `Watcher-${alert.user_id.slice(0, 4)}`

        const key = token.tokenAddress
        if (!tokenWatchers.has(key)) {
          tokenWatchers.set(key, {
            token,
            watchers: []
          })
        }

        tokenWatchers.get(key)!.watchers.push({
          alert,
          userId: alert.user_id,
          threshold,
          alertType: alert.alert_type,
          displayName,
          discordUsername: userRecord.discordUsername
        })

        sentAlerts.push(`${token.symbol} (${thresholdLabel})`)
      }
    }

    for (const { token, watchers } of tokenWatchers.values()) {
      await sendKothAlertToDiscord(
        {
          tokenAddress: token.tokenAddress,
          name: token.name,
          symbol: token.symbol,
          score: token.score,
          progress: token.progress,
          priceUsd: token.priceUsd,
          liquidity: token.liquidity,
          volume24h: token.volume24h,
          curveSpeed: token.curveSpeed,
          whaleCount: token.whaleCount,
          whaleInflows: token.whaleInflows
        },
        watchers.map(watcher => ({
          displayName: watcher.discordUsername || watcher.displayName,
          alertType: watcher.alertType,
          threshold: watcher.threshold
        }))
      )

      for (const watcher of watchers) {
        await supabaseAdmin.from('alert_history').insert({
          user_id: watcher.userId,
          token_address: token.tokenAddress,
          token_name: token.name,
          token_symbol: token.symbol,
          alert_score: token.score,
          alert_progress: token.progress,
          sent_at: new Date().toISOString()
        })
      }
    }

    const result = {
      success: true,
      sentCount: sentAlerts.length,
      sentAlerts
    }
    await recordCronSuccess('alerts:send', {
      sentCount: sentAlerts.length
    })
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error sending alerts:', error)
    await recordCronFailure('alerts:send', error)
    return NextResponse.json(
      { error: 'Failed to send alerts' },
      { status: 500 }
    )
  }
}

/**
 * Background job to check and send alerts
 * Supports both POST (default) and GET (for Vercel Cron)
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runAlertsJob()
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runAlertsJob()
}

