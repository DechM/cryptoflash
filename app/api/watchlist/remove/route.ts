import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isProUser } from '@/lib/subscription'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, tokenAddress } = body

    if (!userId || !tokenAddress) {
      return NextResponse.json(
        { error: 'User ID and token address required' },
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

    // Remove from watchlist
    const { error } = await supabaseAdmin
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('token_address', tokenAddress)

    if (error) {
      console.error('Error removing from watchlist:', error)
      return NextResponse.json(
        { error: 'Failed to remove from watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in watchlist remove route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

