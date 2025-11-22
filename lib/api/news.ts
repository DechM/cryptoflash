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
 * Check if title or description contains crypto keywords
 */
function hasCryptoKeywords(title: string, description?: string): boolean {
  const searchText = `${title} ${description || ''}`.toUpperCase()
  
  for (const keyword of CRYPTO_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return true
    }
  }
  
  return false
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
 * Hook word + crypto keyword = highest priority
 */
function calculatePriority(
  hasHook: boolean,
  hasCrypto: boolean,
  hookWord?: string | null
): number {
  if (hasHook && hasCrypto) {
    // Highest priority: both hook and crypto keywords
    return 100
  }
  if (hasHook) {
    // Medium-high: hook word only
    return 70
  }
  if (hasCrypto) {
    // Medium: crypto keywords only
    return 50
  }
  return 0
}

/**
 * Filter news items based on relevance
 */
export function filterNewsItems(
  items: RSSItem[],
  source: string
): FilteredNewsItem[] {
  const filtered: FilteredNewsItem[] = []

  for (const item of items) {
    const hook = hasHookWord(item.title)
    const hasHook = hook !== null
    const hasCrypto = hasCryptoKeywords(item.title, item.description)
    const isUS = isUSRelated(item.title, item.description)

    // Only include items with hook word OR crypto keywords
    if (hasHook || hasCrypto) {
      const priority = calculatePriority(hasHook, hasCrypto, hook)
      
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

