import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isProUser } from '@/lib/subscription'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Check if user is Pro
    const isPro = await isProUser(userId)
    if (!isPro) {
      return NextResponse.json(
        { 
          error: 'PRO_SUBSCRIPTION_REQUIRED',
          message: 'Alert history is a Pro feature' 
        },
        { status: 403 }
      )
    }

    // Get history from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabaseAdmin
      .from('alert_history')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
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

