import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { sendKothAlertToDiscord } from '@/lib/discord'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to send test alert' },
        { status: 401 }
      )
    }

    const userId = user.id

    const [{ data: discordLink }, { data: userData }] = await Promise.all([
      supabaseAdmin
        .from('discord_links')
        .select('discord_username, discord_user_id')
        .eq('user_id', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', userId)
        .maybeSingle()
    ])

    if (!discordLink?.discord_user_id) {
      return NextResponse.json(
        {
          error: 'DISCORD_NOT_LINKED',
          message: 'Please link your Discord account first. Go to /alerts and click "Link Discord".'
        },
        { status: 400 }
      )
    }

    await sendKothAlertToDiscord(
      {
        tokenAddress: 'TEST_TOKEN_ADDRESS',
        name: 'Test Token',
        symbol: 'TEST',
        score: 95.5,
        progress: 98.2,
        priceUsd: 0.000001,
        liquidity: 12.5,
        volume24h: 42.0,
        curveSpeed: 7.2,
        whaleCount: 0,
        whaleInflows: 0
      },
      [
        {
          displayName:
            discordLink.discord_username ||
            (userData?.email ? userData?.email.split('@')[0] : 'Watcher'),
          alertType: 'score',
          threshold: 95.0
        }
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Test alert sent! Check the Discord KOTH channel.'
    })
  } catch (error: any) {
    console.error('Error sending test alert:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
