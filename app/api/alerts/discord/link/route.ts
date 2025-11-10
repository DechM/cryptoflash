import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUserFromRequest } from '@/lib/auth'
import { getDiscordAuthorizeUrl, removeUserRole } from '@/lib/discord'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const state = crypto.randomBytes(32).toString('hex')

    const { error } = await supabaseAdmin
      .from('discord_oauth_states')
      .insert({ state, user_id: user.id, redirect_path: '/alerts' })

    if (error) {
      console.error('[Alerts Discord Link] Failed to insert OAuth state:', error)
      return NextResponse.json({ error: 'Failed to start Discord linking' }, { status: 500 })
    }

    const authorizeUrl = getDiscordAuthorizeUrl(state)

    return NextResponse.json({ authorizeUrl })
  } catch (error: unknown) {
    console.error('[Alerts Discord Link] Error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Failed to start Discord linking' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data } = await supabaseAdmin
      .from('discord_links')
      .select('discord_user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (data?.discord_user_id) {
      try {
        await removeUserRole(data.discord_user_id)
      } catch (error) {
        console.warn('[Alerts Discord Link] Failed to remove Discord role during unlink:', error)
      }
    }

    await supabaseAdmin.from('discord_links').delete().eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[Alerts Discord Link] Failed to unlink:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Failed to unlink Discord account' }, { status: 500 })
  }
}

