import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserByUsername, getMonitoredAccounts } from '@/lib/api/x-monitor'
import { isAdminEmail } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Admin endpoint to populate X user IDs cache
 * Populates user IDs gradually with delays to avoid rate limits
 * Free tier: 1 request / 24 hours per user
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await request.headers.get('authorization')
    // For now, allow if CRON_SECRET is provided or if called from admin
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Try to get user from session if available
      // For simplicity, allow if CRON_SECRET matches
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = getMonitoredAccounts()
    console.log(`[Populate X User IDs] Starting to populate ${accounts.length} accounts`)

    const results: Array<{ username: string; success: boolean; userId?: string; error?: string }> = []

    for (const username of accounts) {
      try {
        // Check if already cached
        const { data: existing } = await supabaseAdmin
          .from('x_user_ids')
          .select('user_id, last_updated')
          .eq('username', username.toLowerCase())
          .maybeSingle()

        if (existing?.user_id) {
          const lastUpdated = new Date(existing.last_updated).getTime()
          const now = Date.now()
          const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60)
          
          if (hoursSinceUpdate < 23) {
            // Already cached and fresh
            console.log(`[Populate X User IDs] ${username}: Already cached (${hoursSinceUpdate.toFixed(1)}h old)`)
            results.push({ username, success: true, userId: existing.user_id })
            continue
          }
        }

        // Fetch from API
        console.log(`[Populate X User IDs] Fetching ${username}...`)
        const user = await getUserByUsername(username)
        
        if (user) {
          // Save to database
          await supabaseAdmin
            .from('x_user_ids')
            .upsert({
              username: username.toLowerCase(),
              user_id: user.id,
              name: user.name,
              last_updated: new Date().toISOString()
            }, {
              onConflict: 'username'
            })
          
          console.log(`[Populate X User IDs] ${username}: Success (${user.id})`)
          results.push({ username, success: true, userId: user.id })
        } else {
          console.warn(`[Populate X User IDs] ${username}: Failed to get user`)
          results.push({ username, success: false, error: 'User not found' })
        }

        // Rate limit: 1 request / 24 hours per user
        // Add delay between requests to be safe (even though we're only doing once)
        // Wait 5 seconds between requests to avoid any issues
        if (username !== accounts[accounts.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      } catch (error: any) {
        console.error(`[Populate X User IDs] Error for ${username}:`, error.message)
        results.push({ username, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      total: accounts.length,
      successCount,
      failCount,
      results
    })
  } catch (error: any) {
    console.error('[Populate X User IDs] Unexpected error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

