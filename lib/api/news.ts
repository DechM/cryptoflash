/**
 * News Aggregator and Filter
 * Filters RSS news items based on crypto-relevant keywords
 */

import { RSSItem } from './rss'

// Level 1: Hook words (must appear in first 5-7 words of title)
const HOOK_WORDS = [
  'JUST IN',
  'BREAKING',
  'UPDATE',
  'CONFIRMED',
  'EXCLUSIVE',
  'LEAKED',
  'HAPPENING NOW',
  'EMERGENCY',
  'ALERT',
  'FLASH'
] as const

// Hook word weights (higher = more important)
const HOOK_WEIGHTS: Record<string, number> = {
  'BREAKING': 50,
  'EMERGENCY': 45,
  'JUST IN': 40,
  'EXCLUSIVE': 35,
  'CONFIRMED': 30,
  'LEAKED': 25,
  'HAPPENING NOW': 20,
  'UPDATE': 20,
  'ALERT': 15,
  'FLASH': 15
}

// Level 2: Crypto-specific keywords
const CRYPTO_KEYWORDS = [
  'SEC',
  'ETF APPROVED',
  'ETF DENIED',
  'BITCOIN ETF',
  'ETHEREUM ETF',
  'SPOT ETF',
  'BLACKROCK',
  'GRAYSCALE',
  'TRUMP',
  'BIDEN',
  'HARRIS',
  'REGULATION',
  'BAN',
  'AIRDROP',
  'HACK',
  'EXPLOIT',
  'WHALE ALERT',
  'LIQUIDATION',
  '$100M',
  'MICHAEL SAYLOR',
  'MICROSTRATEGY',
  'BINANCE',
  'COINBASE',
  'GENSLER',
  'CZ',
  'LAYER 2',
  'MAINNET LAUNCH',
  'STAKING',
  'BURN',
  'TOKEN BURN',
  'PARTNERSHIP',
  'LISTING',
  'DELISTING',
  'UPGRADE'
] as const

// Keyword weights (higher = more important)
const KEYWORD_WEIGHTS: Record<string, number> = {
  // Highest priority keywords
  'SEC': 30,
  'ETF APPROVED': 30,
  'ETF DENIED': 30,
  'BITCOIN ETF': 30,
  'ETHEREUM ETF': 30,
  'SPOT ETF': 30,
  // High priority keywords
  'TRUMP': 25,
  'BIDEN': 25,
  'HARRIS': 25,
  'HACK': 25,
  'EXPLOIT': 25,
  '$100M': 25,
  // Medium-high priority keywords
  'BLACKROCK': 20,
  'GRAYSCALE': 20,
  'REGULATION': 20,
  'BAN': 20,
  'MICHAEL SAYLOR': 20,
  'MICROSTRATEGY': 20,
  'GENSLER': 20,
  // Medium priority keywords
  'BINANCE': 15,
  'COINBASE': 15,
  'CZ': 15,
  'WHALE ALERT': 15,
  'LIQUIDATION': 15,
  'AIRDROP': 15,
  // Lower priority keywords (technical/news)
  'LAYER 2': 10,
  'MAINNET LAUNCH': 10,
  'STAKING': 10,
  'BURN': 10,
  'TOKEN BURN': 10,
  'PARTNERSHIP': 10,
  'LISTING': 10,
  'DELISTING': 10,
  'UPGRADE': 10
}

// US-related keywords (for 🇺🇸 flag)
const US_KEYWORDS = [
  'TRUMP',
  'BIDEN',
  'HARRIS',
  'SEC',
  'BLACKROCK',
  'GRAYSCALE',
  'GENSLER',
  'US',
  'USA',
  'AMERICAN',
  'WASHINGTON',
  'FEDERAL'
] as const

export interface FilteredNewsItem extends RSSItem {
  hook?: string
  isUSRelated: boolean
  priority: number
  source: string
}

/**
 * Check if title contains a hook word in the first 5-7 words
 */
function hasHookWord(title: string): string | null {
  const firstWords = title.split(/\s+/).slice(0, 7).join(' ').toUpperCase()
  
  for (const hook of HOOK_WORDS) {
    if (firstWords.includes(hook)) {
      return hook
    }
  }
  
  return null
}

/**
 * Check if title or description contains crypto keywords and return the highest weight keyword
 */
function getCryptoKeywordWeight(title: string, description?: string): number {
  const searchText = `${title} ${description || ''}`.toUpperCase()
  let maxWeight = 0
  
  for (const keyword of CRYPTO_KEYWORDS) {
    if (searchText.includes(keyword)) {
      const weight = KEYWORD_WEIGHTS[keyword] || 10
      if (weight > maxWeight) {
        maxWeight = weight
      }
    }
  }
  
  return maxWeight
}

/**
 * Check if news is US-related (for flag emoji)
 */
function isUSRelated(title: string, description?: string): boolean {
  const searchText = `${title} ${description || ''}`.toUpperCase()
  
  for (const keyword of US_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return true
    }
  }
  
  return false
}

/**
 * Calculate priority score (higher = more important)
 * Uses detailed weights for hooks, keywords, and bonuses
 */
function calculatePriority(
  hookWord: string | null,
  keywordWeight: number,
  isUS: boolean,
  hasImage: boolean,
  isFresh: boolean,
  source: string
): number {
  let score = 0
  
  // Hook word weight
  if (hookWord) {
    score += HOOK_WEIGHTS[hookWord] || 15
  }
  
  // Keyword weight
  score += keywordWeight
  
  // Bonuses
  if (isUS) {
    score += 10 // US-related bonus
  }
  
  if (hasImage) {
    score += 5 // Image bonus
  }
  
  if (isFresh) {
    score += 10 // Fresh news bonus (< 1 hour)
  }
  
  // Source bonus (CoinDesk and CoinTelegraph are more reliable)
  if (source === 'CoinDesk' || source === 'CoinTelegraph') {
    score += 5
  }
  
  return score
}

/**
 * Filter news items based on relevance
 */
export function filterNewsItems(
  items: RSSItem[],
  source: string
): FilteredNewsItem[] {
  const filtered: FilteredNewsItem[] = []
  const now = Date.now()

  for (const item of items) {
    const hook = hasHookWord(item.title)
    const keywordWeight = getCryptoKeywordWeight(item.title, item.description)
    const isUS = isUSRelated(item.title, item.description)
    const hasImage = !!item.imageUrl
    
    // Check if news is fresh (< 1 hour old)
    let isFresh = false
    if (item.pubDate) {
      const pubTime = new Date(item.pubDate).getTime()
      const hoursSincePub = (now - pubTime) / (1000 * 60 * 60)
      isFresh = hoursSincePub < 1
    }

    // Only include items with hook word OR crypto keywords
    if (hook || keywordWeight > 0) {
      const priority = calculatePriority(hook, keywordWeight, isUS, hasImage, isFresh, source)
      
      filtered.push({
        ...item,
        hook: hook || undefined,
        isUSRelated: isUS,
        priority,
        source
      })
    }
  }

  // Sort by priority (highest first), then by pubDate (newest first)
  filtered.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority
    }
    
    // If same priority, sort by date (newer first)
    if (a.pubDate && b.pubDate) {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    }
    if (a.pubDate) return -1
    if (b.pubDate) return 1
    return 0
  })

  return filtered
}

