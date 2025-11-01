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
          message: 'Watchlist is a Pro feature'
        },
        { status: 403 }
      )
    }

    // Get watchlist
    const { data, error } = await supabaseAdmin
      .from('user_watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Error fetching watchlist:', error)
      return NextResponse.json(
        { error: 'Failed to fetch watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ watchlist: data || [] })
  } catch (error: any) {
    console.error('Error in watchlist route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

