import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserTier, getAlertThreshold, getMaxDailyAlerts } from '@/lib/subscription'
import { sendTelegramMessage, formatKOTHAlert } from '@/lib/api/telegram'

/**
 * Background job to check and send alerts
 * This should be called periodically (via Vercel Cron or similar)
 */
export async function POST(request: Request) {
  try {
    // Get latest KOTH tokens
    const kothResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/koth-data`)
    const { tokens } = await kothResponse.json()

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ message: 'No tokens to check' })
    }

    // Get all active alerts
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from('user_alerts')
      .select('*')
      .eq('is_active', true)

    if (alertsError || !alerts) {
      console.error('Error fetching alerts:', alertsError)
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    const sentAlerts: string[] = []

    // Check each alert against tokens
    for (const alert of alerts) {
      const userTier = await getUserTier(alert.user_id)
      const threshold = alert.threshold_value || getAlertThreshold(userTier)
      const maxDaily = getMaxDailyAlerts(userTier)

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

      // Send alerts for matching tokens
      for (const token of matchingTokens) {
        // Get user telegram chat ID
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('telegram_chat_id, telegram_username')
          .eq('id', alert.user_id)
          .single()

        if (!user?.telegram_chat_id) {
          continue // Skip if no Telegram chat ID
        }

        // Send Telegram message
        const message = formatKOTHAlert({
          name: token.name,
          symbol: token.symbol,
          address: token.tokenAddress,
          score: token.score,
          progress: token.progress,
          priceUsd: token.priceUsd
        })

        const sent = await sendTelegramMessage({
          chat_id: user.telegram_chat_id,
          text: message
        })

        if (sent) {
          // Log to alert history
          await supabaseAdmin
            .from('alert_history')
            .insert({
              user_id: alert.user_id,
              token_address: token.tokenAddress,
              token_name: token.name,
              token_symbol: token.symbol,
              alert_score: token.score,
              alert_progress: token.progress,
              sent_at: new Date().toISOString()
            })

          sentAlerts.push(`${token.symbol} to ${user.telegram_username}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      sentCount: sentAlerts.length,
      sentAlerts
    })
  } catch (error: any) {
    console.error('Error sending alerts:', error)
    return NextResponse.json(
      { error: 'Failed to send alerts' },
      { status: 500 }
    )
  }
}

