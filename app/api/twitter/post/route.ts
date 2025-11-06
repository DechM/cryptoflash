import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { postTweet, formatTwitterPost } from '@/lib/api/twitter'
import { Token } from '@/lib/types'

/**
 * Twitter Post Endpoint
 * Called by Vercel Cron every 30 minutes
 * 
 * Logic:
 * 1. Fetch latest KOTH tokens (80%+ progress)
 * 2. Check which tokens are NOT in twitter_posts table (prevent duplicates)
 * 3. Filter: Only tokens with score > 85 (quality filter)
 * 4. Sort by score DESC
 * 5. Post top 1-2 tokens (if any)
 * 6. Save to twitter_posts table
 * 7. Rate limit: Max 1 post per 30 minutes, max 30 posts per day
 */

// Rate limiting constants
const MIN_POST_INTERVAL = 30 * 60 * 1000 // 30 minutes
const MAX_POSTS_PER_DAY = 15 // Safety margin for 500/month free tier limit

export async function POST(request: Request) {
  try {
    // Verify this is called from Vercel Cron (optional security check)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check daily post limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: todayCount } = await supabaseAdmin
      .from('twitter_posts')
      .select('*', { count: 'exact', head: true })
      .gte('posted_at', today.toISOString())

    if ((todayCount || 0) >= MAX_POSTS_PER_DAY) {
      console.log(`Daily limit reached: ${todayCount}/${MAX_POSTS_PER_DAY} posts today`)
      return NextResponse.json({
        success: false,
        message: 'Daily post limit reached',
        todayCount
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

      if (timeSinceLastPost < MIN_POST_INTERVAL) {
        const minutesRemaining = Math.ceil((MIN_POST_INTERVAL - timeSinceLastPost) / 60000)
        console.log(`Rate limit: ${minutesRemaining} minutes until next post`)
        return NextResponse.json({
          success: false,
          message: 'Rate limit: too soon since last post',
          minutesRemaining
        })
      }
    }

    // Fetch latest KOTH tokens
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    const kothResponse = await fetch(`${baseUrl}/api/koth-data`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!kothResponse.ok) {
      throw new Error('Failed to fetch KOTH data')
    }

    const { tokens }: { tokens: Token[] } = await kothResponse.json()

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ message: 'No tokens available' })
    }

    // Filter: 80%+ progress, score > 85
    const eligibleTokens = tokens.filter(
      (token) => token.progress >= 80 && token.score > 85
    )

    if (eligibleTokens.length === 0) {
      return NextResponse.json({ message: 'No eligible tokens (80%+ progress, score > 85)' })
    }

    // Get already posted tokens
    const { data: postedTokens } = await supabaseAdmin
      .from('twitter_posts')
      .select('token_address')

    const postedAddresses = new Set(postedTokens?.map((t) => t.token_address) || [])

    // Filter out already posted tokens
    const newTokens = eligibleTokens.filter(
      (token) => !postedAddresses.has(token.tokenAddress)
    )

    if (newTokens.length === 0) {
      return NextResponse.json({ message: 'All eligible tokens already posted' })
    }

    // Sort by score DESC and take top 1-2 tokens
    const topTokens = newTokens
      .sort((a, b) => b.score - a.score)
      .slice(0, 2) // Post max 2 tokens per run

    const postedTweets: Array<{ token: string; tweetId: string | null }> = []

    // Post each token
    for (const token of topTokens) {
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

      if (tweetResult) {
        // Save to database
        await supabaseAdmin.from('twitter_posts').insert({
          token_address: token.tokenAddress,
          token_name: token.name,
          token_symbol: token.symbol,
          score: token.score,
          progress: token.progress,
          tweet_id: tweetResult.id,
          posted_at: new Date().toISOString()
        })

        postedTweets.push({
          token: `${token.symbol} (${token.name})`,
          tweetId: tweetResult.id
        })

        console.log(`Posted tweet for ${token.symbol}: ${tweetResult.id}`)

        // Wait 1 second between posts (if posting multiple)
        if (topTokens.length > 1 && token !== topTokens[topTokens.length - 1]) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      } else {
        console.error(`Failed to post tweet for ${token.symbol}`)
      }
    }

    return NextResponse.json({
      success: true,
      postedCount: postedTweets.length,
      postedTweets,
      todayTotal: (todayCount || 0) + postedTweets.length,
      dailyLimit: MAX_POSTS_PER_DAY
    })
  } catch (error: any) {
    console.error('Error in Twitter post endpoint:', error)
    return NextResponse.json(
      {
        error: 'Failed to post to Twitter',
        message: error.message
      },
      { status: 500 }
    )
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({
    message: 'Twitter post endpoint - use POST to trigger',
    rateLimit: {
      minInterval: '30 minutes',
      maxPerDay: MAX_POSTS_PER_DAY
    }
  })
}

