import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in' },
        { status: 401 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('discord_links')
      .select('discord_username, discord_user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[Discord Link Status] Failed to fetch link:', error)
      return NextResponse.json(
        { error: 'Failed to fetch Discord link status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      linked: Boolean(data?.discord_user_id),
      discord_username: data?.discord_username ?? null,
      discord_user_id: data?.discord_user_id ?? null
    })
  } catch (error: unknown) {
    console.error('[Discord Link Status] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

