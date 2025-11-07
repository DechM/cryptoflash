import { NextRequest, NextResponse } from 'next/server'

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    const { id } = await context.params

    const { data, error } = await supabaseAdmin
      .from('whale_events')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('[Whales API] Failed to fetch whale event by id:', error)
      return NextResponse.json({ error: 'Failed to fetch whale event' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Whale event not found' }, { status: 404 })
    }

    return NextResponse.json({ event: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Whales API] Unexpected error (detail):', message)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
