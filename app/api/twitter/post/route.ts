import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { postTweet, formatTwitterPost, formatWhaleTweet, formatNewsTweet } from '@/lib/api/twitter'
import { sendNewsToDiscord } from '@/lib/discord'
import { Token, WhaleEvent } from '@/lib/types'
import { MIN_WHALE_ALERT_USD } from '@/lib/whales'
import { recordCronFailure, recordCronSuccess } from '@/lib/cron'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for video download/upload

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
const WHALE_RETENTION_HOURS = Number(process.env.WHALE_EVENT_RETENTION_HOURS || '48')
const KOTH_REPOST_COOLDOWN_HOURS = Number(process.env.KOTH_REPOST_COOLDOWN_HOURS || '48')

// Twitter-specific thresholds and limits
const TWITTER_WHALE_MIN_USD = Number(process.env.TWITTER_WHALE_MIN_USD || '300000') // Only post whales >= $300k
const MAX_WHALE_POSTS_PER_DAY = 2 // Max 2 whale alerts per day
const MAX_KOTH_POSTS_PER_DAY = 1 // Max 1 KOTH alert per day
const MAX_NEWS_POSTS_PER_DAY = 12 // Max 12 news posts per day (rest of quota for quality breaking news)
const MIN_NEWS_PRIORITY = Number(process.env.MIN_NEWS_PRIORITY || '70') // Minimum priority score to post (only most important news)

function getCooldownCutoff(hours: number): number {
  return Date.now() - hours * 60 * 60 * 1000
}

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

async function markOlderWhalesAsPosted(cutoffIso: string) {
  try {
    await supabaseAdmin
      .from('whale_events')
      .update({ posted_to_twitter: true })
      .eq('posted_to_twitter', false)
      .lt('block_time', cutoffIso)
  } catch (error) {
    console.warn('[Twitter Post] Failed to mark older whale events as posted:', error)
  }
}

async function cleanupWhaleRetention() {
  if (WHALE_RETENTION_HOURS <= 0) return
  const cutoffIso = new Date(getCooldownCutoff(WHALE_RETENTION_HOURS)).toISOString()
  try {
    await supabaseAdmin
      .from('whale_events')
      .delete()
      .lt('block_time', cutoffIso)

    await supabaseAdmin
      .from('whale_events')
      .delete()
      .is('block_time', null)
      .lt('created_at', cutoffIso)
  } catch (error) {
    console.warn('[Twitter Post] Failed to prune stale whale events:', error)
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


  // Check daily whale post limit (whale events have null progress, KOTH have progress >= 69)
  const { count: whalePostsToday } = await supabaseAdmin
    .from('twitter_posts')
    .select('*', { count: 'exact', head: true })
    .gte('posted_at', today.toISOString())
    .not('tweet_id', 'is', null)
    .is('progress', null) // Whale events don't have progress field

  const whalePostsCount = whalePostsToday || 0
  console.log(`[Twitter Post] Whale posts today: ${whalePostsCount}/${MAX_WHALE_POSTS_PER_DAY}`)

  // Check for pending whale events before KOTH tweets (only if under daily limit)
  let pendingWhale: WhaleEvent | null = null
  if (whalePostsCount < MAX_WHALE_POSTS_PER_DAY) {
    const { data: whaleData } = await supabaseAdmin
      .from('whale_events')
      .select('*')
      .eq('posted_to_twitter', false)
      .gte('block_time', new Date(Date.now() - 90 * 60 * 1000).toISOString())
      .order('amount_usd', { ascending: false }) // Get largest whales first
      .limit(1)
      .maybeSingle<WhaleEvent>()

    pendingWhale = whaleData || null
  } else {
    console.log(`[Twitter Post] Whale post limit reached (${whalePostsCount}/${MAX_WHALE_POSTS_PER_DAY}), skipping whale checks`)
  }

  if (pendingWhale && (pendingWhale.amount_usd || 0) >= TWITTER_WHALE_MIN_USD) {
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
        supabaseAdmin
          .from('twitter_posts')
          .upsert({
            token_address: pendingWhale.tx_hash,
            token_name: pendingWhale.token_name || pendingWhale.token_symbol || pendingWhale.token_address,
            token_symbol: pendingWhale.token_symbol,
            score: pendingWhale.amount_usd || null,
            progress: null,
            tweet_id: tweetResult.id,
            posted_at: new Date().toISOString()
          }, { onConflict: 'token_address' })
      )

      const updateResults = await Promise.allSettled(updatePromises)
      updateResults.forEach((result, idx) => {
        if (result.status === 'rejected') {
          console.error('[Twitter Post] Failed to persist whale tweet metadata', idx, result.reason)
        }
      })

      if (pendingWhale.block_time) {
        await markOlderWhalesAsPosted(pendingWhale.block_time)
      }
      await cleanupWhaleRetention()

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

  await cleanupWhaleRetention()

  // Check daily news post limit
  const { count: newsPostsToday } = await supabaseAdmin
    .from('news_posts')
    .select('*', { count: 'exact', head: true })
    .gte('posted_at', today.toISOString())
    .not('tweet_id', 'is', null)
    .eq('posted_to_twitter', true)

  const newsPostsCount = newsPostsToday || 0
  console.log(`[Twitter Post] News posts today: ${newsPostsCount}/${MAX_NEWS_POSTS_PER_DAY}`)

  // Check for pending news items
  // WatcherGuru posts always get priority (bypass daily limit and priority threshold)
  let pendingNews: { id: string; title: string; hook?: string; is_us_related: boolean; link: string; image_url?: string | null; video_url?: string | null; source?: string; priority: number } | null = null
  
    // First, check for WatcherGuru posts (always post these, bypass limits)
    const { data: watcherGuruNews } = await supabaseAdmin
      .from('news_posts')
      .select('id, title, hook, is_us_related, link, image_url, video_url, source, priority')
      .eq('posted_to_twitter', false)
      .like('source', 'X:WatcherGuru')
      .order('pub_date', { ascending: false })
      .limit(1)
      .maybeSingle()

  if (watcherGuruNews) {
    pendingNews = watcherGuruNews
    console.log(`[Twitter Post] Found WatcherGuru post (always posted, bypassing limits): ${pendingNews.title}`)
  } else if (newsPostsCount < MAX_NEWS_POSTS_PER_DAY) {
    // If no WatcherGuru post, check for other high-priority news
    const { data: newsData } = await supabaseAdmin
      .from('news_posts')
      .select('id, title, hook, is_us_related, link, image_url, video_url, source, priority')
      .eq('posted_to_twitter', false)
      .gte('priority', MIN_NEWS_PRIORITY) // Only most important news
      .order('priority', { ascending: false })
      .order('pub_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    pendingNews = newsData || null
    
    if (pendingNews) {
      console.log(`[Twitter Post] Found news item with priority ${pendingNews.priority}: ${pendingNews.title}`)
    } else {
      console.log(`[Twitter Post] No news items found with priority >= ${MIN_NEWS_PRIORITY}`)
    }
  } else {
    console.log(`[Twitter Post] News post limit reached (${newsPostsCount}/${MAX_NEWS_POSTS_PER_DAY}), skipping news checks`)
  }

  // Post news if available (before KOTH, but after whale)
  if (pendingNews) {
    // HARD FILTER: Only post news from the last 30 minutes (breaking news must be VERY fresh)
    // We scan every 15 minutes, so 30 minutes ensures we catch everything from the last scan
    if (pendingNews.pub_date) {
      const newsTime = new Date(pendingNews.pub_date).getTime()
      const minutesSinceNews = (Date.now() - newsTime) / (1000 * 60)
      
      if (minutesSinceNews > 30) {
        console.warn(`[Twitter Post] Skipping old news (${minutesSinceNews.toFixed(0)}min old): ${pendingNews.title}`)
        // Mark as posted to avoid retrying
        await supabaseAdmin
          .from('news_posts')
          .update({ posted_to_twitter: true })
          .eq('id', pendingNews.id)
        pendingNews = null
      }
    }

    if (pendingNews) {
      console.log('[Twitter Post] Found news item candidate:', pendingNews.title)
      const tweetText = formatNewsTweet({
        title: pendingNews.title,
        hook: pendingNews.hook || undefined,
        isUSRelated: pendingNews.is_us_related || false,
        link: pendingNews.link
      })
    const tweetResult = await postTweet(
      tweetText, 
      pendingNews.image_url || null,
      pendingNews.video_url || null // Priority: video > image > text only
    )

    if (tweetResult && 'rateLimited' in tweetResult) {
      console.warn('[Twitter Post] Twitter rate limit during news post. Skipping rest of job.')
      const fallbackReset = Math.floor(Date.now() / 1000) + (20 * 60)
      await setStoredResumeAt(tweetResult.resetAt || fallbackReset)
      await recordCronSuccess('twitter:post', {
        postedCount: 0,
        reason: 'rate-limited-news',
        resetAt: tweetResult.resetAt || null
      })
      return NextResponse.json({
        success: false,
        rateLimited: true,
        rateLimitedUntil: tweetResult.resetAt || null,
        message: 'Twitter rate limit hit while posting news'
      })
    }

    if (tweetResult) {
      console.log('[Twitter Post] Posted news tweet:', tweetResult.id)

      // Post to Discord automatically after successful X post
      try {
        await sendNewsToDiscord({
          title: pendingNews.title,
          hook: pendingNews.hook || null,
          isUSRelated: pendingNews.is_us_related || false,
          link: pendingNews.link,
          imageUrl: pendingNews.image_url || null,
          videoUrl: pendingNews.video_url || null,
          source: pendingNews.source || 'CryptoFlash'
        })
        console.log('[Twitter Post] Posted news to Discord successfully')
      } catch (discordError: any) {
        console.warn('[Twitter Post] Failed to post news to Discord:', discordError.message)
        // Don't fail the whole job if Discord fails
      }

      const { error: updateError } = await supabaseAdmin
        .from('news_posts')
        .update({ 
          posted_to_twitter: true, 
          tweet_id: tweetResult.id,
          posted_at: new Date().toISOString()
        })
        .eq('id', pendingNews.id)

      if (updateError) {
        console.error('[Twitter Post] Failed to update news post:', updateError)
      }

      await setStoredResumeAt(null)

      const newsResult = {
        success: true,
        postedNews: true,
        tweetId: tweetResult.id,
        newsId: pendingNews.id
      }
      await recordCronSuccess('twitter:post', {
        postedCount: 1,
        mode: 'news',
        tweetId: tweetResult.id
      })
      return NextResponse.json(newsResult)
    } else {
      console.error('[Twitter Post] Failed to post news tweet - postTweet returned null/undefined')
    }
  }

  // Check daily KOTH post limit
  const { count: kothPostsToday } = await supabaseAdmin
    .from('twitter_posts')
    .select('*', { count: 'exact', head: true })
    .gte('posted_at', today.toISOString())
    .not('tweet_id', 'is', null)
    .not('progress', 'is', null)
    .gte('progress', 69) // KOTH tokens have progress >= 69%

  const kothPostsCount = kothPostsToday || 0
  console.log(`[Twitter Post] KOTH posts today: ${kothPostsCount}/${MAX_KOTH_POSTS_PER_DAY}`)

  if (kothPostsCount >= MAX_KOTH_POSTS_PER_DAY) {
    console.log(`[Twitter Post] KOTH post limit reached (${kothPostsCount}/${MAX_KOTH_POSTS_PER_DAY}), skipping KOTH posts`)
    await recordCronSuccess('twitter:post', {
      postedCount: 0,
      reason: 'koth-daily-limit',
      kothPostsCount
    })
    return NextResponse.json({
      success: false,
      message: 'KOTH daily limit reached',
      kothPostsCount,
      whalePostsCount
    })
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
    .select('token_address, posted_at')

  const reuseCutoff = getCooldownCutoff(KOTH_REPOST_COOLDOWN_HOURS)
  const postedAddresses = new Set(
    (postedTokens || [])
      .filter((t) => {
        if (!t?.token_address) return false
        if (!t.posted_at) return true
        const postedTs = new Date(t.posted_at).getTime()
        return Number.isNaN(postedTs) ? true : postedTs >= reuseCutoff
      })
      .map((t) => t.token_address)
  )
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

  // Calculate how many KOTH posts we can still make today
  const remainingKothSlots = MAX_KOTH_POSTS_PER_DAY - kothPostsCount
  const MAX_TOKENS_PER_RUN = Math.min(remainingKothSlots, 2) // Max 2 KOTH posts per run, but respect daily limit

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
      const { error: insertError } = await supabaseAdmin
        .from('twitter_posts')
        .upsert({
          token_address: token.tokenAddress,
          token_name: token.name,
          token_symbol: token.symbol,
          score: token.score,
          progress: token.progress,
          tweet_id: tweetResult.id,
          posted_at: new Date().toISOString()
        }, { onConflict: 'token_address' })

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
  
  return result
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

