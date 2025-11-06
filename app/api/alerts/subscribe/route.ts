import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLimit, getUserPlan } from '@/lib/plan'
import { getCurrentUser } from '@/lib/auth'
import type { PlanId } from '@/lib/plan'

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    
    if (!user) {
      console.error('Alert creation failed: No authenticated user found')
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to create alerts' },
        { status: 401 }
      )
    }
    
    console.log('Creating alert for user:', user.id, user.email)
    const userId = user.id

    const body = await request.json()
    const { tokenAddress, alertType, thresholdValue } = body

    // Get plan from database (source of truth)
    const plan = await getUserPlan(userId)
    
    // Check if Telegram is linked (required for all plans to receive alerts)
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('telegram_chat_id')
      .eq('id', userId)
      .single()

    if (!userData?.telegram_chat_id) {
      return NextResponse.json(
        {
          error: 'TELEGRAM_NOT_LINKED',
          message: 'Please link your Telegram account first to receive alerts. Click "Open Telegram Bot" above.'
        },
        { status: 400 }
      )
    }
    
    const maxAlerts = getLimit(plan, 'alerts.max_tokens') as number

    // Check current active alerts
    const { data: activeAlerts } = await supabaseAdmin
      .from('user_alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)

    const activeCount = activeAlerts?.length || 0

    if (activeCount >= maxAlerts) {
      return NextResponse.json(
        {
          error: 'MAX_ALERTS_REACHED',
          message: plan === 'free' 
            ? 'Free users can track 1 token. Upgrade to Pro (19.99 USDC/mo) or Ultimate (39.99 USDC/mo) for more alerts!'
            : plan === 'pro'
            ? 'Pro users can track up to 10 tokens. Upgrade to Ultimate for unlimited!'
            : 'Alert limit reached',
          upgradeRequired: plan === 'free'
        },
        { status: 403 }
      )
    }

    // Create alert
    const { data, error } = await supabaseAdmin
      .from('user_alerts')
      .insert({
        user_id: userId,
        token_address: tokenAddress || null, // null = all tokens
        alert_type: alertType || 'score',
        threshold_value: thresholdValue || (getLimit(plan, 'alerts.threshold_min') as number),
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating alert:', error)
      return NextResponse.json(
        { error: 'Failed to create alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      alert: data 
    })
  } catch (error: any) {
    console.error('Error in subscribe route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

