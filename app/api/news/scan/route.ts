import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchAllFeeds } from '@/lib/api/rss'
import { filterNewsItems, FilteredNewsItem } from '@/lib/api/news'
import { recordCronFailure, recordCronSuccess } from '@/lib/cron'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * News Scan Cron Job
 * Scans RSS feeds every 5 minutes, filters relevant crypto news,
 * and stores them in the database for Twitter posting
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[News Scan] Starting RSS feed scan at', new Date().toISOString())

    // Fetch all RSS feeds
    const feeds = await fetchAllFeeds()
    console.log(`[News Scan] Fetched ${feeds.length} feeds`)

    if (feeds.length === 0) {
      await recordCronSuccess('news:scan', { scannedFeeds: 0, newItems: 0, note: 'No feeds available' })
      return NextResponse.json({ success: true, scannedFeeds: 0, newItems: 0 })
    }

    // Filter news items from all feeds
    const allFilteredItems: FilteredNewsItem[] = []
    for (const { feed, source } of feeds) {
      const filtered = filterNewsItems(feed.items, source)
      allFilteredItems.push(...filtered)
      console.log(`[News Scan] ${source}: ${feed.items.length} items → ${filtered.length} relevant`)
    }

    console.log(`[News Scan] Total relevant items: ${allFilteredItems.length}`)

    if (allFilteredItems.length === 0) {
      await recordCronSuccess('news:scan', { scannedFeeds: feeds.length, newItems: 0, note: 'No relevant news found' })
      return NextResponse.json({ success: true, scannedFeeds: feeds.length, newItems: 0 })
    }

    // Check which items are already in the database (by link)
    const links = allFilteredItems.map(item => item.link)
    const { data: existingPosts } = await supabaseAdmin
      .from('news_posts')
      .select('link')
      .in('link', links)

    const existingLinks = new Set(existingPosts?.map(p => p.link) || [])
    const newItems = allFilteredItems.filter(item => !existingLinks.has(item.link))

    console.log(`[News Scan] New items to store: ${newItems.length}`)

    if (newItems.length === 0) {
      await recordCronSuccess('news:scan', { 
        scannedFeeds: feeds.length, 
        newItems: 0, 
        totalRelevant: allFilteredItems.length,
        note: 'All items already in database' 
      })
      return NextResponse.json({ 
        success: true, 
        scannedFeeds: feeds.length, 
        newItems: 0,
        totalRelevant: allFilteredItems.length
      })
    }

    // Insert new items into database
    const insertData = newItems.map(item => ({
      title: item.title,
      description: item.description || null,
      link: item.link,
      source: item.source,
      hook: item.hook || null,
      is_us_related: item.isUSRelated,
      priority: item.priority,
      image_url: item.imageUrl || null,
      pub_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      posted_to_twitter: false,
      tweet_id: null,
      posted_at: null
    }))

    const { error: insertError } = await supabaseAdmin
      .from('news_posts')
      .insert(insertData)

    if (insertError) {
      console.error('[News Scan] Failed to insert news items:', insertError)
      await recordCronFailure('news:scan', insertError.message)
      return NextResponse.json({ error: 'Failed to store news items' }, { status: 500 })
    }

    console.log(`[News Scan] Successfully stored ${newItems.length} new items`)

    await recordCronSuccess('news:scan', {
      scannedFeeds: feeds.length,
      newItems: newItems.length,
      totalRelevant: allFilteredItems.length
    })

    return NextResponse.json({
      success: true,
      scannedFeeds: feeds.length,
      newItems: newItems.length,
      totalRelevant: allFilteredItems.length
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[News Scan] Unexpected error:', message)
    await recordCronFailure('news:scan', message)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

