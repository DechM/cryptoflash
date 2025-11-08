import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUserFromRequest, getUserPlan } from '@/lib/auth'
import { getMoralisStatus } from '@/lib/api/moralis'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const user = await getCurrentUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const plan = await getUserPlan(user.id)
  if (plan !== 'ultimate') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const moralis = getMoralisStatus()

  const [{ data: twitterLimits, error: twitterError }, { data: cronStatus, error: cronError }] = await Promise.all([
    supabaseAdmin
      .from('twitter_rate_limits')
      .select('key, resume_at, updated_at')
      .order('updated_at', { ascending: false }),
    supabaseAdmin
      .from('cron_status')
      .select('*')
      .order('updated_at', { ascending: false })
  ])

  return NextResponse.json({
    moralis,
    twitter: {
      rows: twitterLimits || [],
      error: twitterError ? twitterError.message : null
    },
    cron: {
      rows: cronStatus || [],
      error: cronError ? cronError.message : null
    }
  })
}
