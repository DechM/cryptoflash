/**
 * X (Twitter) News Aggregator
 * Filters and scores tweets from monitored X accounts
 */

import { XTweet } from './x-monitor'
import { reformatTweet } from './x-reformatter'
import { 
  getCryptoKeywordWeight, 
  calculatePriority, 
  isUSRelated as checkUSRelated
} from './news'

export interface FilteredXNewsItem {
  tweetId: string
  originalText: string
  formattedText: string
  authorUsername: string
  authorId: string
  hook?: string
  isUSRelated: boolean
  priority: number
  imageUrl?: string
  createdAt: string
  source: string
}

/**
 * Filter and score X tweets
 */
export function filterXTweets(
  tweets: XTweet[],
  authorUsername: string
): FilteredXNewsItem[] {
  const filtered: FilteredXNewsItem[] = []
  const now = Date.now()

  for (const tweet of tweets) {
    // Reformat tweet
    const reformatted = reformatTweet(tweet)

    // Skip if should exclude (price changes, etc.)
    if (reformatted.shouldExclude) {
      continue
    }

    // Check for important keywords
    const keywordWeight = getCryptoKeywordWeight(reformatted.text)
    const isUS = reformatted.isUSRelated || checkUSRelated(reformatted.text)
    const hasImage = !!reformatted.imageUrl

    // Check if tweet is fresh (< 1 hour old)
    let isFresh = false
    if (tweet.created_at) {
      const tweetTime = new Date(tweet.created_at).getTime()
      const hoursSinceTweet = (now - tweetTime) / (1000 * 60 * 60)
      isFresh = hoursSinceTweet < 1
    }

    // Only include if has hook OR important keywords
    if (reformatted.hook || keywordWeight > 0) {
      const priority = calculatePriority(
        reformatted.hook || null,
        keywordWeight,
        isUS,
        hasImage,
        isFresh,
        authorUsername
      )

      filtered.push({
        tweetId: tweet.id,
        originalText: tweet.text,
        formattedText: reformatted.text,
        authorUsername,
        authorId: tweet.author_id,
        hook: reformatted.hook,
        isUSRelated: isUS,
        priority,
        imageUrl: reformatted.imageUrl,
        createdAt: tweet.created_at,
        source: `X:${authorUsername}`
      })
    }
  }

  // Sort by priority (highest first), then by date (newest first)
  filtered.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority
    }
    
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (a.createdAt) return -1
    if (b.createdAt) return 1
    return 0
  })

  return filtered
}

