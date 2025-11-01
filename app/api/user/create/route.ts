import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Create or get user - auto-create if doesn't exist
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { telegramUsername, email } = body

    if (!telegramUsername) {
      return NextResponse.json(
        { error: 'Telegram username required' },
        { status: 400 }
      )
    }

    try {
      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('telegram_username', telegramUsername)
        .single()

      // If user exists, return it
      if (existingUser && !fetchError) {
        return NextResponse.json({
          userId: existingUser.id,
          user: existingUser
        })
      }

      // Create new user
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          telegram_username: telegramUsername,
          email: email || null,
          subscription_status: 'free'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        // If Supabase is not configured, generate a mock UUID for development
        if (error.code === 'PGRST116' || error.message?.includes('relation "users" does not exist')) {
          const mockUserId = crypto.randomUUID()
          return NextResponse.json({
            userId: mockUserId,
            user: {
              id: mockUserId,
              telegram_username: telegramUsername,
              subscription_status: 'free'
            },
            warning: 'Database not configured, using mock user ID'
          })
        }
        return NextResponse.json(
          { error: 'Failed to create user', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        userId: newUser.id,
        user: newUser
      })
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      // Fallback: generate mock user ID if database is unavailable
      const mockUserId = crypto.randomUUID()
      return NextResponse.json({
        userId: mockUserId,
        user: {
          id: mockUserId,
          telegram_username: telegramUsername,
          subscription_status: 'free'
        },
        warning: 'Database not available, using mock user ID for development'
      })
    }
  } catch (error: any) {
    console.error('Error in user create route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

