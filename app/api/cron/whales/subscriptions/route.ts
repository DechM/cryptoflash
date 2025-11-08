import { NextRequest, NextResponse } from 'next/server'

import { expireStaleWhaleSubscriptions } from '@/lib/whale-subscription'
import { recordCronFailure, recordCronSuccess } from '@/lib/cron'
import { isSupabaseConfigured } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { count } = await expireStaleWhaleSubscriptions()
    await recordCronSuccess('whales:subscriptions', { expired: count })
    return NextResponse.json({ success: true, expired: count })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Whale Subscriptions Cron] Error:', message)
    await recordCronFailure('whales:subscriptions', message)
    return NextResponse.json({ error: 'Failed to process subscriptions' }, { status: 500 })
  }
}


