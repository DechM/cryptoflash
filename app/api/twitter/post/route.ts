import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { postTweet, formatTwitterPost, formatWhaleTweet } from '@/lib/api/twitter'
import { Token, WhaleEvent } from '@/lib/types'
import { MIN_WHALE_ALERT_USD } from '@/lib/whales'
import { recordCronFailure, recordCronSuccess } from '@/lib/cron'

/**
 * Twitter Post Endpoint
 * Called by Vercel Cron every 30 minutes
 * 
 * Logic:
 * 1. Fetch latest KOTH tokens (70%+ progress)
 * 2. Check which tokens are NOT in twitter_posts table (prevent duplicates)
 * 3. Filter: Only tokens with score > 75 (quality filter)
 * 4. Sort by score DESC
 * 5. Post top 1-2 tokens (if any)
 * 6. Save to twitter_posts table
 * 7. Rate limit: Max 1 post per 30 minutes, max 15 posts per day
 */

// Rate limiting constants
const MIN_POST_INTERVAL = 20 * 60 * 1000 // 20 minutes between posts
const MAX_POSTS_PER_DAY = 15 // 15 posts/day = 450 posts/month (safe margin for 500/month free tier)

async function getStoredResumeAt(): Promise<Date | null> {
  const { data } = await supabaseAdmin
    .from('twitter_rate_limits')
    .select('resume_at')
    .eq('key', 'global')
    .maybeSingle<{ resume_at: string | null }>()

  if (!data?.resume_at) {
    return null
  }

  const resumeAt = new Date(data.resume_at)
  return Number.isNaN(resumeAt.getTime()) ? null : resumeAt
}

async function setStoredResumeAt(unixSeconds: number | null) {
  const resumeAt = unixSeconds ? new Date(unixSeconds * 1000) : null
  const iso = resumeAt && Number.isFinite(resumeAt.getTime()) ? resumeAt.toISOString() : null
  const { error } = await supabaseAdmin
    .from('twitter_rate_limits')
    .upsert({ key: 'global', resume_at: iso }, { onConflict: 'key' })

  if (error) {
    console.error('[Twitter Post] Failed to persist rate limit resume_at:', error)
  }
}

/**
 * Main logic for posting tweets (shared between POST and GET)
 */
async function handleTwitterPost() {
  console.log('[Twitter Post] Starting Twitter post job at', new Date().toISOString())
  
  // Check daily post limit
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: todayCount } = await supabaseAdmin
    .from('twitter_posts')
    .select('*', { count: 'exact', head: true })
    .gte('posted_at', today.toISOString())

  console.log(`[Twitter Post] Daily count: ${todayCount || 0}/${MAX_POSTS_PER_DAY}`)

  if ((todayCount || 0) >= MAX_POSTS_PER_DAY) {
    console.log(`[Twitter Post] Daily limit reached: ${todayCount}/${MAX_POSTS_PER_DAY} posts today`)
    await recordCronSuccess('twitter:post', {
      postedCount: 0,
      reason: 'daily-limit',
      todayCount
    })
    return NextResponse.json({
      success: false,
      message: 'Daily post limit reached',
      todayCount
    })
  }

  const storedResumeAt = await getStoredResumeAt()
  if (storedResumeAt && storedResumeAt.getTime() > Date.now()) {
    const minutesRemaining = Math.max(0, Math.ceil((storedResumeAt.getTime() - Date.now()) / 60000))
    console.warn(`[Twitter Post] Stored rate limit active until ${storedResumeAt.toISOString()} (${minutesRemaining} min left)`)
    await recordCronSuccess('twitter:post', {
      postedCount: 0,
      reason: 'stored-rate-limit',
      resumeAt: storedResumeAt.toISOString(),
      minutesRemaining
    })
    return NextResponse.json({
      success: false,
      message: 'Twitter rate limit active',
      resumeAt: storedResumeAt.toISOString(),
      minutesRemaining
    })
  }

  // Check last post time (rate limiting)
  const { data: lastPost } = await supabaseAdmin
    .from('twitter_posts')
    .select('posted_at')
    .order('posted_at', { ascending: false })
    .limit(1)
    .single()

  if (lastPost?.posted_at) {
    const lastPostTime = new Date(lastPost.posted_at).getTime()
    const timeSinceLastPost = Date.now() - lastPostTime
    const minutesSinceLastPost = Math.floor(timeSinceLastPost / 60000)

    console.log(`[Twitter Post] Last post was ${minutesSinceLastPost} minutes ago (at ${lastPost.posted_at})`)

    if (timeSinceLastPost < MIN_POST_INTERVAL) {
      const minutesRemaining = Math.ceil((MIN_POST_INTERVAL - timeSinceLastPost) / 60000)
      console.log(`[Twitter Post] Rate limit: ${minutesRemaining} minutes until next post`)
      await recordCronSuccess('twitter:post', {
        postedCount: 0,
        reason: 'internal-rate-limit',
        minutesRemaining,
        lastPostTime: lastPost.posted_at
      })
      return NextResponse.json({
        success: false,
        message: 'Rate limit: too soon since last post',
        minutesRemaining,
        lastPostTime: lastPost.posted_at,
        minutesSinceLastPost
      })
    }
  } else {
    console.log('[Twitter Post] No previous posts found')
  }


  // Check for pending whale events before KOTH tweets
  const { data: pendingWhale } = await supabaseAdmin
    .from('whale_events')
    .select('*')
    .eq('posted_to_twitter', false)
    .order('block_time', { ascending: false })
    .limit(1)
    .maybeSingle<WhaleEvent>()

  if (pendingWhale && (pendingWhale.amount_usd || 0) >= MIN_WHALE_ALERT_USD) {
    console.log('[Twitter Post] Found whale event candidate:', pendingWhale.tx_hash, 'USD', pendingWhale.amount_usd)
    const tweetText = formatWhaleTweet(pendingWhale)
    const tweetResult = await postTweet(tweetText)

    if (tweetResult && 'rateLimited' in tweetResult) {
      console.warn('[Twitter Post] Twitter rate limit during whale post. Skipping rest of job.')
      const fallbackReset = Math.floor(Date.now() / 1000) + (20 * 60)
      await setStoredResumeAt(tweetResult.resetAt || fallbackReset)
      await recordCronSuccess('twitter:post', {
        postedCount: 0,
        reason: 'rate-limited-whale',
        resetAt: tweetResult.resetAt || null
      })
      return NextResponse.json({
        success: false,
        rateLimited: true,
        rateLimitedUntil: tweetResult.resetAt || null,
        message: 'Twitter rate limit hit while posting whale event'
      })
    }

    if (tweetResult) {
      console.log('[Twitter Post] Posted whale alert tweet:', tweetResult.id)

      const updatePromises = []
      updatePromises.push(
        supabaseAdmin
          .from('whale_events')
          .update({ posted_to_twitter: true, tweet_id: tweetResult.id })
          .eq('id', pendingWhale.id)
      )

      updatePromises.push(
        supabaseAdmin.from('twitter_posts').insert({
          token_address: pendingWhale.tx_hash,
          token_name: pendingWhale.token_name || pendingWhale.token_symbol || pendingWhale.token_address,
          token_symbol: pendingWhale.token_symbol,
          score: pendingWhale.amount_usd || null,
          progress: null,
          tweet_id: tweetResult.id,
          posted_at: new Date().toISOString()
        })
      )

      const updateResults = await Promise.allSettled(updatePromises)
      updateResults.forEach((result, idx) => {
        if (result.status === 'rejected') {
          console.error('[Twitter Post] Failed to persist whale tweet metadata', idx, result.reason)
        }
      })

      await setStoredResumeAt(null)

      const whaleResult = {
        success: true,
        postedWhale: true,
        tweetId: tweetResult.id,
        whaleEventId: pendingWhale.id
      }
      await recordCronSuccess('twitter:post', {
        postedCount: 1,
        mode: 'whale',
        tweetId: tweetResult.id
      })
      return NextResponse.json(whaleResult)
    } else {
      console.error('[Twitter Post] Failed to post whale tweet - postTweet returned null/undefined')
    }
  }

  // Fetch latest KOTH tokens
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/g, '') || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')).replace(/\/$/, '')
  const kothResponse = await fetch(`${baseUrl}/api/koth-data`, {
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!kothResponse.ok) {
    throw new Error('Failed to fetch KOTH data')
  }

  const { tokens }: { tokens: Token[] } = await kothResponse.json()

  console.log(`[Twitter Post] Fetched ${tokens?.length || 0} tokens from KOTH data`)

  if (!tokens || tokens.length === 0) {
    console.log('[Twitter Post] No tokens available')
    await recordCronSuccess('twitter:post', {
      postedCount: 0,
      reason: 'no-tokens'
    })
    return NextResponse.json({ message: 'No tokens available' })
  }

  // Log token stats for debugging
  if (tokens.length > 0) {
    const topTokens = tokens
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
    console.log(`[Twitter Post] Top 5 tokens by score:`, topTokens.map(t => ({
      symbol: t.symbol,
      score: t.score,
      progress: t.progress
    })))
  }

  // Filter: 69%+ progress, score >= 72 (optimized for early alerts)
  const eligibleTokens = tokens.filter(
    (token) => (token.progress || 0) >= 69 && (token.score || 0) >= 72
  )

  console.log(`[Twitter Post] Found ${eligibleTokens.length} eligible tokens (69%+ progress, score >= 72)`)
  
  if (eligibleTokens.length > 0) {
    console.log(`[Twitter Post] Top eligible token: ${eligibleTokens[0].symbol} - Score: ${eligibleTokens[0].score}, Progress: ${eligibleTokens[0].progress}%`)
  }

  if (eligibleTokens.length === 0) {
    console.log('[Twitter Post] No eligible tokens found')
    // Return detailed info for debugging
    const tokenStats = {
      total: tokens.length,
      withProgress: tokens.filter(t => t.progress && t.progress > 0).length,
      withScore: tokens.filter(t => t.score && t.score > 0).length,
      maxProgress: tokens.length > 0 ? Math.max(...tokens.map(t => t.progress || 0)) : 0,
      maxScore: tokens.length > 0 ? Math.max(...tokens.map(t => t.score || 0)) : 0,
      avgProgress: tokens.length > 0 ? tokens.reduce((sum, t) => sum + (t.progress || 0), 0) / tokens.length : 0,
      avgScore: tokens.length > 0 ? tokens.reduce((sum, t) => sum + (t.score || 0), 0) / tokens.length : 0
    }
    console.log('[Twitter Post] Token stats:', tokenStats)
    await recordCronSuccess('twitter:post', {
      postedCount: 0,
      reason: 'no-eligible-tokens',
      tokenStats
    })
    return NextResponse.json({ 
      success: false,
      message: 'No eligible tokens (69%+ progress, score >= 72)',
      tokenStats,
      eligibleCount: 0
    })
  }

  // Get already posted tokens
  const { data: postedTokens } = await supabaseAdmin
    .from('twitter_posts')
    .select('token_address')

  const postedAddresses = new Set(postedTokens?.map((t) => t.token_address) || [])
  console.log(`[Twitter Post] Found ${postedAddresses.size} already posted tokens`)

  // Filter out already posted tokens
  const newTokens = eligibleTokens.filter(
    (token) => !postedAddresses.has(token.tokenAddress)
  )

  console.log(`[Twitter Post] Found ${newTokens.length} new tokens to post`)

  if (newTokens.length === 0) {
    console.log('[Twitter Post] All eligible tokens already posted')
    const payload = { 
      success: false,
      message: 'All eligible tokens already posted',
      eligibleCount: eligibleTokens.length,
      alreadyPostedCount: postedAddresses.size,
      eligibleTokens: eligibleTokens.map(t => ({
        symbol: t.symbol,
        address: t.tokenAddress,
        score: t.score,
        progress: t.progress
      }))
    }
    await recordCronSuccess('twitter:post', {
      postedCount: 0,
      reason: 'already-posted',
      eligibleCount: eligibleTokens.length
    })
    return NextResponse.json(payload)
  }

  const MAX_TOKENS_PER_RUN = 1

  // Sort by score DESC and take top tokens (rate limit safe)
  const topTokens = newTokens
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_TOKENS_PER_RUN)

  console.log(`[Twitter Post] Will post ${topTokens.length} token(s) (max per run: ${MAX_TOKENS_PER_RUN}):`, topTokens.map(t => `${t.symbol} (score: ${t.score}, progress: ${t.progress}%)`))

  const postedTweets: Array<{ token: string; tweetId: string | null }> = []
  let rateLimitedUntil: number | null = null

  // Post each token
  for (const token of topTokens) {
    console.log(`[Twitter Post] Attempting to post ${token.symbol} (${token.name})...`)
    // Check if we've hit daily limit during this run
    if ((todayCount || 0) + postedTweets.length >= MAX_POSTS_PER_DAY) {
      console.log('Daily limit reached during posting')
      break
    }

    const tweetText = formatTwitterPost({
      name: token.name,
      symbol: token.symbol,
      address: token.tokenAddress,
      score: token.score,
      progress: token.progress,
      priceUsd: token.priceUsd
    })

    const tweetResult = await postTweet(tweetText)

    if (tweetResult && 'rateLimited' in tweetResult) {
      rateLimitedUntil = tweetResult.resetAt || null
      const fallbackReset = Math.floor(Date.now() / 1000) + (20 * 60)
      await setStoredResumeAt(rateLimitedUntil || fallbackReset)
      const resetDate = rateLimitedUntil ? new Date(rateLimitedUntil * 1000).toISOString() : 'unknown'
      console.warn(`[Twitter Post] Rate limited by Twitter. Reset at: ${resetDate}. Skipping remaining posts.`)
      break
    }

    if (tweetResult) {
      console.log(`[Twitter Post] Successfully posted tweet for ${token.symbol}: ${tweetResult.id}`)
      
      // Save to database
      const { error: insertError } = await supabaseAdmin.from('twitter_posts').insert({
        token_address: token.tokenAddress,
        token_name: token.name,
        token_symbol: token.symbol,
        score: token.score,
        progress: token.progress,
        tweet_id: tweetResult.id,
        posted_at: new Date().toISOString()
      })

      if (insertError) {
        console.error(`[Twitter Post] Error saving to database:`, insertError)
      } else {
        console.log(`[Twitter Post] Saved to database: ${token.tokenAddress}`)
      }

      postedTweets.push({
        token: `${token.symbol} (${token.name})`,
        tweetId: tweetResult.id
      })

      // Wait 1 second between posts (if posting multiple)
      if (topTokens.length > 1 && token !== topTokens[topTokens.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } else {
      console.error(`[Twitter Post] Failed to post tweet for ${token.symbol} - postTweet returned null/undefined`)
    }
  }

  if (postedTweets.length > 0) {
    await setStoredResumeAt(null)
  } else if (rateLimitedUntil) {
    const fallbackReset = Math.floor(Date.now() / 1000) + (20 * 60)
    await setStoredResumeAt(rateLimitedUntil || fallbackReset)
  }

  const result = {
    success: true,
    postedCount: postedTweets.length,
    postedTweets,
    todayTotal: (todayCount || 0) + postedTweets.length,
    dailyLimit: MAX_POSTS_PER_DAY,
    rateLimitedUntil
  }

  console.log(`[Twitter Post] Job completed:`, result)
  await recordCronSuccess('twitter:post', {
    postedCount: postedTweets.length,
    todayTotal: result.todayTotal,
    rateLimitedUntil
  })
  
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  try {
    // Verify this is called from Vercel Cron (optional security check)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return await handleTwitterPost()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error in Twitter post endpoint (POST):', message)
    await recordCronFailure('twitter:post', message)
    return NextResponse.json(
      {
        error: 'Failed to post to Twitter',
        message
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Allow GET for Vercel Cron (which may send GET requests)
    // Also useful for manual testing
    const result = await handleTwitterPost()
    // Ensure we always return a proper response
    if (!result) {
      const message = 'No response from handler'
      await recordCronFailure('twitter:post', message)
      return NextResponse.json({ error: message }, { status: 500 })
    }
    return result
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Twitter Post] Error in GET endpoint:', message)
    await recordCronFailure('twitter:post', message)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to post to Twitter',
        message,
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

