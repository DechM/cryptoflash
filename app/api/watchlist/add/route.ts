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

    // Check watchlist limit (20 tokens)
    const { data: watchlist } = await supabaseAdmin
      .from('user_watchlist')
      .select('id')
      .eq('user_id', userId)

    if (watchlist && watchlist.length >= 20) {
      return NextResponse.json(
        {
          error: 'WATCHLIST_LIMIT_REACHED',
          message: 'Watchlist limit is 20 tokens'
        },
        { status: 403 }
      )
    }

    // Add to watchlist
    const { data, error } = await supabaseAdmin
      .from('user_watchlist')
      .insert({
        user_id: userId,
        token_address: tokenAddress
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate entry
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Token already in watchlist' },
          { status: 409 }
        )
      }
      console.error('Error adding to watchlist:', error)
      return NextResponse.json(
        { error: 'Failed to add to watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, item: data })
  } catch (error: any) {
    console.error('Error in watchlist add route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

