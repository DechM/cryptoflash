import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getMonitoredAccounts, getCachedUserId, getUserTweets } from '@/lib/api/x-monitor'
import { filterXTweets, FilteredXNewsItem } from '@/lib/api/x-news'
import { recordCronFailure, recordCronSuccess } from '@/lib/cron'
import { sendNewsToDiscord } from '@/lib/discord'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * News Scan Cron Job
 * Scans X (Twitter) accounts every 15 minutes, filters relevant crypto news,
 * and stores them in the database for Twitter posting
 * 
 * Free tier: 1 request / 15 mins per user
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[News Scan] Starting X account scan at', new Date().toISOString())

    const accounts = getMonitoredAccounts()
    console.log(`[News Scan] Monitoring ${accounts.length} X accounts`)

    if (accounts.length === 0) {
      await recordCronSuccess('news:scan', { scannedAccounts: 0, newItems: 0, note: 'No accounts to monitor' })
      return NextResponse.json({ success: true, scannedAccounts: 0, newItems: 0 })
    }

    // Get last processed tweet ID for each account (to avoid duplicates)
    const { data: lastTweets } = await supabaseAdmin
      .from('news_posts')
      .select('source, tweet_id')
      .not('tweet_id', 'is', null)
      .order('created_at', { ascending: false })

    const lastTweetMap = new Map<string, string>()
    if (lastTweets) {
      for (const post of lastTweets) {
        if (post.source && post.tweet_id) {
          const sourceKey = post.source.replace('X:', '')
          if (!lastTweetMap.has(sourceKey)) {
            lastTweetMap.set(sourceKey, post.tweet_id)
          }
        }
      }
    }

    // Fetch tweets from all monitored accounts
    const allFilteredItems: FilteredXNewsItem[] = []
    let scannedCount = 0

    for (const username of accounts) {
      try {
        // Get user ID (cached to avoid rate limits)
        const userId = await getCachedUserId(username)
        if (!userId) {
          console.warn(`[News Scan] Could not get user ID for: ${username}`)
          continue
        }

        // Get last tweet ID for this account
        const sinceId = lastTweetMap.get(username)

        // Fetch tweets (free tier: 1 request / 15 mins per user)
        const tweets = await getUserTweets(userId, username, sinceId, 10)
        scannedCount++

        if (tweets.length === 0) {
          console.log(`[News Scan] ${username}: No new tweets${sinceId ? ` (since ${sinceId})` : ' (no sinceId)'}`)
          continue
        }
        
        // Debug: Log tweet ages
        const now = Date.now()
        const tweetAges = tweets.map(t => {
          if (!t.created_at) return 'no-date'
          const age = (now - new Date(t.created_at).getTime()) / (1000 * 60)
          return `${age.toFixed(1)}min`
        })
        console.log(`[News Scan] ${username}: ${tweets.length} tweets fetched, ages: ${tweetAges.join(', ')}`)

        // VALIDATION: Double-check that tweets are from the correct user
        // This is a safety net in case getUserTweets validation fails
        const validatedTweets = tweets.filter(tweet => {
          if (tweet.author_id !== userId) {
            console.error(`[News Scan] SECURITY: Tweet ${tweet.id} from ${username} has mismatched author_id. Expected ${userId}, got ${tweet.author_id}. Skipping.`)
            return false
          }
          return true
        })

        if (validatedTweets.length < tweets.length) {
          console.warn(`[News Scan] Filtered out ${tweets.length - validatedTweets.length} tweets with mismatched author_id for ${username}`)
        }

        // Filter and score validated tweets only
        const filtered = filterXTweets(validatedTweets, username)
        allFilteredItems.push(...filtered)
        console.log(`[News Scan] ${username}: ${tweets.length} tweets → ${filtered.length} relevant`)

        // Rate limit: 1 request / 15 mins per user for free tier
        // Add delay between accounts to respect rate limits (5 seconds for safety)
        if (username !== accounts[accounts.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay to avoid rate limits
        }
      } catch (error: any) {
        console.error(`[News Scan] Error processing ${username}:`, error.message)
        continue
      }
    }

    console.log(`[News Scan] Total relevant items: ${allFilteredItems.length}`)
    
    // Debug: Log age of filtered items
    if (allFilteredItems.length > 0) {
      const now = Date.now()
      const ages = allFilteredItems.map(item => {
        if (!item.createdAt) return 'no-date'
        const age = (now - new Date(item.createdAt).getTime()) / (1000 * 60)
        return `${age.toFixed(1)}min`
      })
      console.log(`[News Scan] Filtered items ages: ${ages.join(', ')}`)
    }

    if (allFilteredItems.length === 0) {
      console.log(`[News Scan] No relevant news found. Scanned ${scannedCount} accounts.`)
      await recordCronSuccess('news:scan', { scannedAccounts: scannedCount, newItems: 0, note: 'No relevant news found' })
      return NextResponse.json({ success: true, scannedAccounts: scannedCount, newItems: 0 })
    }

    // Check which items are already in the database (by tweet_id)
    const tweetIds = allFilteredItems.map(item => item.tweetId).filter(Boolean)
    
    if (tweetIds.length === 0) {
      await recordCronSuccess('news:scan', { 
        scannedAccounts: scannedCount, 
        newItems: 0, 
        totalRelevant: allFilteredItems.length,
        note: 'No tweet IDs to check' 
      })
      return NextResponse.json({ 
        success: true, 
        scannedAccounts: scannedCount, 
        newItems: 0,
        totalRelevant: allFilteredItems.length
      })
    }

    // Check existing posts by tweet_id (in batches if needed)
    const existingTweetIds = new Set<string>()
    const batchSize = 100
    
    for (let i = 0; i < tweetIds.length; i += batchSize) {
      const batch = tweetIds.slice(i, i + batchSize)
      const { data: existingPosts } = await supabaseAdmin
        .from('news_posts')
        .select('tweet_id')
        .in('tweet_id', batch)
      
      if (existingPosts) {
        for (const post of existingPosts) {
          if (post.tweet_id) {
            existingTweetIds.add(post.tweet_id)
          }
        }
      }
    }
    
    const newItems = allFilteredItems.filter(item => !existingTweetIds.has(item.tweetId))

    console.log(`[News Scan] New items to store: ${newItems.length}`)

    if (newItems.length === 0) {
      await recordCronSuccess('news:scan', { 
        scannedAccounts: scannedCount, 
        newItems: 0, 
        totalRelevant: allFilteredItems.length,
        note: 'All items already in database' 
      })
      return NextResponse.json({ 
        success: true, 
        scannedAccounts: scannedCount, 
        newItems: 0,
        totalRelevant: allFilteredItems.length
      })
    }

    // Double-check freshness before inserting (safety net - should already be filtered)
    const now = Date.now()
    const freshItems = newItems.filter(item => {
      if (!item.createdAt) return false // Skip items without timestamp
      const itemTime = new Date(item.createdAt).getTime()
      const minutesSinceItem = (now - itemTime) / (1000 * 60)
      return minutesSinceItem <= 20 // Only items from last 20 minutes
    })

    if (freshItems.length < newItems.length) {
      console.log(`[News Scan] Filtered out ${newItems.length - freshItems.length} old items before inserting`)
    }

    // Separate CryptoFlashGuru posts (our own account) - auto-post to Discord immediately
    const ourPosts = freshItems.filter(item => item.authorUsername.toLowerCase() === 'cryptoflashguru')
    const otherPosts = freshItems.filter(item => item.authorUsername.toLowerCase() !== 'cryptoflashguru')

    // Auto-post CryptoFlashGuru posts to Discord immediately (they're already posted to X manually)
    let discordPostedCount = 0
    for (const item of ourPosts) {
      try {
        const discordResult = await sendNewsToDiscord({
          title: item.formattedText,
          hook: item.hook || null,
          isUSRelated: item.isUSRelated,
          link: `https://twitter.com/${item.authorUsername}/status/${item.tweetId}`,
          imageUrl: item.imageUrl || null,
          videoUrl: item.videoUrl || null,
          source: 'CryptoFlashGuru (Manual)',
        })
        
        if (discordResult?.id) {
          discordPostedCount++
          console.log(`[News Scan] Auto-posted CryptoFlashGuru post to Discord: ${item.tweetId}`)
        }
      } catch (error: any) {
        console.error(`[News Scan] Failed to auto-post CryptoFlashGuru post to Discord:`, error.message)
        // Continue even if Discord post fails - still store in DB
      }
    }

    // Insert all fresh items into database
    // For CryptoFlashGuru posts: mark as posted_to_twitter=true (already posted manually)
    // For other posts: mark as posted_to_twitter=false (will be posted by twitter:post cron)
    const insertData = freshItems.map(item => {
      const isOurPost = item.authorUsername.toLowerCase() === 'cryptoflashguru'
      return {
        title: item.formattedText, // Use reformatted text as title
        description: item.originalText || null, // Store original text in description
        link: `https://twitter.com/${item.authorUsername}/status/${item.tweetId}`,
        source: item.source,
        hook: item.hook || null,
        is_us_related: item.isUSRelated,
        priority: item.priority,
        image_url: item.imageUrl || null,
        video_url: item.videoUrl || null,
        pub_date: item.createdAt ? new Date(item.createdAt).toISOString() : null,
        posted_to_twitter: isOurPost, // Our posts are already on X (posted manually)
        tweet_id: item.tweetId, // Store original tweet ID
        posted_at: isOurPost ? (item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString()) : null
      }
    })

    const { error: insertError } = await supabaseAdmin
      .from('news_posts')
      .insert(insertData)

    if (insertError) {
      console.error('[News Scan] Failed to insert news items:', insertError)
      await recordCronFailure('news:scan', insertError.message)
      return NextResponse.json({ error: 'Failed to store news items' }, { status: 500 })
    }

    console.log(`[News Scan] Successfully stored ${freshItems.length} new items (${newItems.length - freshItems.length} filtered as old)`)
    if (ourPosts.length > 0) {
      console.log(`[News Scan] Auto-posted ${discordPostedCount}/${ourPosts.length} CryptoFlashGuru posts to Discord`)
    }

    await recordCronSuccess('news:scan', {
      scannedAccounts: scannedCount,
      newItems: freshItems.length,
      filteredOld: newItems.length - freshItems.length,
      totalRelevant: allFilteredItems.length,
      ourPosts: ourPosts.length,
      discordPosted: discordPostedCount
    })

    return NextResponse.json({
      success: true,
      scannedAccounts: scannedCount,
      newItems: freshItems.length,
      filteredOld: newItems.length - freshItems.length,
      totalRelevant: allFilteredItems.length,
      ourPosts: ourPosts.length,
      discordPosted: discordPostedCount
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[News Scan] Unexpected error:', message)
    await recordCronFailure('news:scan', message)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

