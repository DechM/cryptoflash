import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserTier, getMaxActiveAlerts } from '@/lib/subscription'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, tokenAddress, alertType, thresholdValue } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Check user tier
    const tier = await getUserTier(userId)
    const maxAlerts = getMaxActiveAlerts(tier)

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
          message: tier === 'free' 
            ? 'Free users can track 1 token. Upgrade to Pro ($4.99) or Ultimate ($19.99) for more alerts!'
            : tier === 'pro'
            ? 'Pro users can track up to 10 tokens. Upgrade to Ultimate for unlimited!'
            : 'Alert limit reached',
          upgradeRequired: tier === 'free'
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
        threshold_value: thresholdValue || (
          tier === 'ultimate' ? 80 :
          tier === 'pro' ? 85 : 95
        ),
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

