import { NextResponse } from 'next/server'
import { getUserTier } from '@/lib/subscription'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    // Get user from session/auth
    // For MVP, we'll use a simple approach with telegram_username or email
    // In production, implement proper authentication
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const tier = await getUserTier(userId)

    return NextResponse.json({ tier })
  } catch (error: any) {
    console.error('Error getting user tier:', error)
    return NextResponse.json(
      { error: 'Failed to get user tier', tier: 'free' },
      { status: 500 }
    )
  }
}

