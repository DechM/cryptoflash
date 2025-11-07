import { NextRequest, NextResponse } from 'next/server'

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const url = new URL(request.url)
  const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 200)
  const eventType = url.searchParams.get('type')
  const token = url.searchParams.get('token')
  const before = url.searchParams.get('before')

  try {
    let query = supabaseAdmin
      .from('whale_events')
      .select('*')
      .order('block_time', { ascending: false })
      .limit(limit)

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    if (token) {
      query = query.eq('token_address', token)
    }

    if (before) {
      query = query.lt('block_time', before)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Whales API] Failed to fetch whale events:', error)
      return NextResponse.json({ error: 'Failed to fetch whale events' }, { status: 500 })
    }

    return NextResponse.json({ events: data || [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Whales API] Unexpected error:', message)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
