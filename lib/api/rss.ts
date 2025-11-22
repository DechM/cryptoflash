/**
 * RSS Feed Parser
 * Fetches and parses RSS feeds from crypto news sources
 */

import axios from 'axios'

export interface RSSItem {
  title: string
  description?: string
  link: string
  pubDate?: string
  imageUrl?: string
}

export interface RSSFeed {
  title: string
  items: RSSItem[]
}

const RSS_FEEDS = [
  {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/'
  },
  {
    name: 'CoinTelegraph',
    url: 'https://cointelegraph.com/rss'
  },
  {
    name: 'Decrypt',
    url: 'https://decrypt.co/feed'
  },
  {
    name: 'CryptoSlate',
    url: 'https://cryptoslate.com/feed/'
  },
  {
    name: 'The Block',
    url: 'https://www.theblock.co/rss.xml'
  }
] as const

/**
 * Parse RSS XML string into structured data
 */
function parseRSS(xml: string, feedName: string): RSSFeed {
  const items: RSSItem[] = []
  
  // Extract title from <title> tag
  const titleMatch = xml.match(/<title>(.*?)<\/title>/i)
  const feedTitle = titleMatch ? titleMatch[1].trim() : feedName

  // Extract all <item> blocks
  // Use [\s\S] instead of . with 's' flag for compatibility
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let itemMatch

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const itemXml = itemMatch[1]
    
    // Extract title
    const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim() : ''

    // Extract description
    const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i)
    const description = descMatch 
      ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, '').trim() 
      : undefined

    // Extract link
    const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i)
    const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim() : ''

    // Extract pubDate
    const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : undefined

    // Extract image from <enclosure> or <media:content>
    let imageUrl: string | undefined
    const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i)
    if (enclosureMatch) {
      imageUrl = enclosureMatch[1]
    } else {
      const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/i)
      if (mediaMatch) {
        imageUrl = mediaMatch[1]
      }
    }

    if (title && link) {
      items.push({
        title,
        description,
        link,
        pubDate,
        imageUrl
      })
    }
  }

  return {
    title: feedTitle,
    items
  }
}

/**
 * Fetch and parse a single RSS feed
 */
export async function fetchRSSFeed(feedUrl: string, feedName: string): Promise<RSSFeed | null> {
  try {
    const response = await axios.get(feedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoFlash RSS Reader)'
      }
    })

    if (!response.data || typeof response.data !== 'string') {
      console.warn(`[RSS] Invalid response from ${feedName}`)
      return null
    }

    return parseRSS(response.data, feedName)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.warn(`[RSS] Failed to fetch ${feedName}: ${error.message}`)
    } else {
      console.warn(`[RSS] Unexpected error fetching ${feedName}:`, error)
    }
    return null
  }
}

/**
 * Fetch all RSS feeds in parallel
 */
export async function fetchAllFeeds(): Promise<Array<{ feed: RSSFeed; source: string }>> {
  const promises = RSS_FEEDS.map(async ({ name, url }) => {
    const feed = await fetchRSSFeed(url, name)
    return feed ? { feed, source: name } : null
  })

  const results = await Promise.allSettled(promises)
  const feeds: Array<{ feed: RSSFeed; source: string }> = []

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      feeds.push(result.value)
    }
  }

  return feeds
}

