import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLimit } from '@/lib/plan'
import type { PlanId } from '@/lib/plan'

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

    // Get plan from cookie (prefer new plan system) or fallback to user tier
    const cookieHeader = request.headers.get('cookie') || ''
    const planCookie = cookieHeader.split(';').find(s => s.trim().startsWith('cf_plan='))
    const planFromCookie = planCookie?.split('=')[1] || null
    
    // Try to get from old system if no cookie
    let plan: PlanId = (planFromCookie as PlanId) || 'free'
    if (!planFromCookie) {
      try {
        const { getUserTier } = await import('@/lib/subscription')
        const oldTier = await getUserTier(userId)
        plan = oldTier as PlanId
      } catch {
        plan = 'free'
      }
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
            ? 'Free users can track 1 token. Upgrade to Pro ($4.99) or Ultimate ($19.99) for more alerts!'
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

