import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUserFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabaseAdmin
      .from('whale_subscribers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: discordLink } = await supabaseAdmin
      .from('discord_links')
      .select('discord_user_id, discord_username, token_expires_at')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      subscription,
      discordLink,
    })
  } catch (error: unknown) {
    console.error('[Whale Status] Failed to fetch status:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
