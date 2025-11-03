import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLimit, getUserPlan } from '@/lib/plan'
import { requireAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    // Require authentication
    const user = await requireAuth()
    const userId = user.id

    // Get user plan from database
    const plan = await getUserPlan(userId)

    // Check if user has access to history
    const historyDays = getLimit(plan, 'history.days') as number
    if (historyDays === 0) {
      return NextResponse.json(
        { 
          error: 'SUBSCRIPTION_REQUIRED',
          message: 'Alert history requires Pro or Ultimate subscription' 
        },
        { status: 403 }
      )
    }

    // Get history based on plan limit
    const historyStartDate = new Date()
    historyStartDate.setDate(historyStartDate.getDate() - historyDays)

    const { data, error } = await supabaseAdmin
      .from('alert_history')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', historyStartDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching alert history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: 500 }
      )
    }

    return NextResponse.json({ history: data || [] })
  } catch (error: any) {
    console.error('Error in history route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

