import { NextRequest, NextResponse } from 'next/server'

import {
  addUserToGuild,
  exchangeDiscordCode,
  getDiscordUser,
} from '@/lib/discord'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const defaultRedirectBase = `${siteUrl}/alerts/whales`
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (errorParam) {
    console.error('[Discord Callback] Received error:', errorParam)
    return NextResponse.redirect(`${defaultRedirectBase}?error=${encodeURIComponent(errorParam)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${defaultRedirectBase}?error=missing_params`)
  }

  const { data: stateRecord, error: stateError } = await supabaseAdmin
    .from('discord_oauth_states')
    .select('*')
    .eq('state', state)
    .maybeSingle()

  if (stateError || !stateRecord) {
    console.error('[Discord Callback] Invalid state parameter')
    return NextResponse.redirect(`${defaultRedirectBase}?error=invalid_state`)
  }

  if (stateRecord.used_at) {
    return NextResponse.redirect(`${defaultRedirectBase}?error=state_reused`)
  }

  try {
    const redirectPath = stateRecord.redirect_path || '/alerts/whales'
    const redirectBase = `${siteUrl}${redirectPath.startsWith('/') ? '' : '/'}${redirectPath.replace(/^\/+/, '')}`

    const tokenResponse = await exchangeDiscordCode(code)
    const me = await getDiscordUser(tokenResponse.access_token)

    try {
      await addUserToGuild(me.id, tokenResponse.access_token)
    } catch (guildError) {
      console.warn('[Discord Callback] Failed to add user to guild:', guildError)
    }

    const tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()

    const { error: upsertError } = await supabaseAdmin
      .from('discord_links')
      .upsert({
        user_id: stateRecord.user_id,
        discord_user_id: me.id,
        discord_username: `${me.username}#${me.discriminator}`,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_expires_at: tokenExpiresAt,
        scope: tokenResponse.scope,
      }, { onConflict: 'user_id' })

    if (upsertError) {
      throw upsertError
    }

    await supabaseAdmin
      .from('discord_oauth_states')
      .update({ used_at: new Date().toISOString() })
      .eq('state', state)

    return NextResponse.redirect(`${redirectBase}?linked=1`)
  } catch (error: unknown) {
    console.error('[Discord Callback] Failed to complete OAuth:', error instanceof Error ? error.message : String(error))
    const redirectPath = stateRecord.redirect_path || '/alerts/whales'
    const redirectBase = `${siteUrl}${redirectPath.startsWith('/') ? '' : '/'}${redirectPath.replace(/^\/+/, '')}`
    return NextResponse.redirect(`${redirectBase}?error=discord`)
  }
}
