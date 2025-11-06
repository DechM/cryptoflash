import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { sendTelegramMessage, formatKOTHAlert } from '@/lib/api/telegram'

/**
 * Test endpoint to send a test alert to the current user's Telegram
 * POST /api/alerts/test-send
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to send test alert' },
        { status: 401 }
      )
    }
    
    const userId = user.id

    // Get user's Telegram chat ID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('telegram_chat_id, telegram_username')
      .eq('id', userId)
      .single()

    if (userError || !userData?.telegram_chat_id) {
      return NextResponse.json(
        { 
          error: 'TELEGRAM_NOT_LINKED',
          message: 'Please link your Telegram account first. Go to /alerts and click "Open Telegram Bot".'
        },
        { status: 400 }
      )
    }

    // Create a test token alert
    const testToken = {
      name: 'Test Token',
      symbol: 'TEST',
      address: 'So11111111111111111111111111111111111111112', // SOL address for testing
      score: 95.5,
      progress: 98.2,
      priceUsd: 0.000001
    }

    const message = `🧪 <b>TEST ALERT - CryptoFlash</b>

✅ <b>Your Telegram alerts are working!</b>

This is a test message to verify your alert system is configured correctly.

💰 <b>${testToken.name} (${testToken.symbol})</b>
📊 Score: <b>${testToken.score.toFixed(1)}/100</b>
📈 Progress: <b>${testToken.progress.toFixed(1)}%</b>
💵 Price: $${testToken.priceUsd.toFixed(6)}

🎯 <b>Real alerts will look like this when tokens match your criteria!</b>

⚠️ <i>This is a test - not a real token</i>`

    const sent = await sendTelegramMessage({
      chat_id: userData.telegram_chat_id,
      text: message
    })

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send test alert. Please check your Telegram bot configuration.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test alert sent successfully! Check your Telegram.'
    })
  } catch (error: any) {
    console.error('Error sending test alert:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

