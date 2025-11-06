import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUserFromRequest } from '@/lib/auth'

/**
 * Link Telegram to authenticated user
 * POST /api/me/link-telegram
 * Body: { chatId: string, username?: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to link Telegram' },
        { status: 401 }
      )
    }
    
    const userId = user.id

    const body = await req.json()
    const { chatId, username } = body

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      )
    }

    // Check if telegram_chat_id is already linked to another user
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, telegram_chat_id')
      .eq('telegram_chat_id', chatId.toString())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found (OK - not linked)
      console.error('Error checking existing telegram link:', checkError)
      return NextResponse.json(
        { error: 'Failed to check telegram link' },
        { status: 500 }
      )
    }

    if (existingUser && existingUser.id !== userId) {
      // Already linked to different user
      return NextResponse.json(
        { 
          error: 'CONFLICT',
          message: 'This Telegram account is already linked to another user' 
        },
        { status: 409 }
      )
    }

    // Update current user with telegram info
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        telegram_chat_id: chatId.toString(),
        telegram_username: username || null
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error linking telegram:', updateError)
      return NextResponse.json(
        { error: 'Failed to link Telegram account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Telegram account linked successfully'
    })
  } catch (error: any) {
    console.error('Error in link-telegram:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get current user's telegram link status
 * GET /api/me/link-telegram
 */
export async function GET(req: NextRequest) {
  try {
    // Debug: Log cookies
    const cookies = req.cookies.getAll()
    console.log('🔍 [link-telegram GET] Cookies received:', cookies.length, 'cookies')
    cookies.forEach(c => {
      if (c.name.includes('supabase') || c.name.includes('auth')) {
        console.log(`  Cookie: ${c.name} = ${c.value.substring(0, 20)}...`)
      }
    })
    
    const user = await getCurrentUserFromRequest(req)
    
    console.log('🔍 [link-telegram GET] User:', user ? `${user.id} (${user.email})` : 'null')
    
    if (!user) {
      console.error('❌ [link-telegram GET] No user found - returning 401')
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in' },
        { status: 401 }
      )
    }
    
    const userId = user.id
    console.log('✅ [link-telegram GET] User authenticated:', userId)

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('telegram_chat_id, telegram_username')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ [link-telegram GET] Error fetching telegram link:', error)
      return NextResponse.json(
        { error: 'Failed to fetch telegram link' },
        { status: 500 }
      )
    }

    console.log('✅ [link-telegram GET] Telegram status:', {
      linked: !!userData?.telegram_chat_id,
      chat_id: userData?.telegram_chat_id || 'null',
      username: userData?.telegram_username || 'null'
    })

    return NextResponse.json({
      linked: !!userData?.telegram_chat_id,
      telegram_chat_id: userData?.telegram_chat_id || null,
      telegram_username: userData?.telegram_username || null
    })
  } catch (error: any) {
    console.error('❌ [link-telegram GET] CRITICAL ERROR:', error)
    console.error('Error stack:', error?.stack)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}

