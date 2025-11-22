/**
 * X (Twitter) Tweet Reformatter
 * Reformats tweets to avoid copy-paste, adds hooks, and extracts key info
 */

import { XTweet } from './x-monitor'

// Hook words that might be in original tweet
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

// Important keywords that should trigger auto-hook
const IMPORTANT_KEYWORDS = [
  'SEC',
  'ETF APPROVED',
  'ETF DENIED',
  'BITCOIN ETF',
  'ETHEREUM ETF',
  'SPOT ETF',
  'TRUMP',
  'BIDEN',
  'HARRIS',
  'BLACKROCK',
  'GRAYSCALE',
  'HACK',
  'EXPLOIT',
  'REGULATION',
  'BAN'
] as const

// US-related keywords
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

// Patterns to exclude (price changes, pumps, dumps)
const EXCLUDE_PATTERNS = [
  /%\s*(up|down|pump|dump)/i,
  /\+\d+%/i,
  /-\d+%/i,
  /\d+%\s*(up|down|gain|loss|rise|fall|surge|crash|plunge)/i,
  /(pump|dump)\s+\d+%/i
]

// BTC/ETH for special handling
const MAJOR_COINS = ['BTC', 'BITCOIN', 'ETH', 'ETHEREUM']

export interface ReformattedTweet {
  text: string
  hook?: string
  isUSRelated: boolean
  hasImportantKeywords: boolean
  shouldExclude: boolean
  imageUrl?: string
  videoUrl?: string
}

/**
 * Check if text contains a hook word
 */
function hasHookWord(text: string): string | null {
  const upperText = text.toUpperCase()
  for (const hook of HOOK_WORDS) {
    if (upperText.includes(hook)) {
      return hook
    }
  }
  return null
}

/**
 * Check if text contains important keywords
 */
function hasImportantKeywords(text: string): boolean {
  const upperText = text.toUpperCase()
  for (const keyword of IMPORTANT_KEYWORDS) {
    if (upperText.includes(keyword)) {
      return true
    }
  }
  return false
}

/**
 * Check if text is US-related
 */
function isUSRelated(text: string): boolean {
  const upperText = text.toUpperCase()
  for (const keyword of US_KEYWORDS) {
    if (upperText.includes(keyword)) {
      return true
    }
  }
  return false
}

/**
 * Check if text should be excluded (price changes, pumps, etc.)
 */
function shouldExclude(text: string, hasBreaking: boolean): boolean {
  // Don't exclude if it's BREAKING + BTC/ETH
  if (hasBreaking) {
    const upperText = text.toUpperCase()
    const hasMajorCoin = MAJOR_COINS.some(coin => upperText.includes(coin))
    if (hasMajorCoin) {
      return false // Allow BREAKING + BTC/ETH even with % changes
    }
  }

  // Check exclude patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(text)) {
      return true
    }
  }

  return false
}

/**
 * Remove all URLs from text (http://, https://, www., twitter.com, x.com, t.co)
 */
function removeUrls(text: string): string {
  // Remove all URLs: http://, https://, www., twitter.com, x.com, t.co
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|twitter\.com\/[^\s]+|x\.com\/[^\s]+|t\.co\/[^\s]+)/gi
  return text.replace(urlRegex, '').trim()
}

/**
 * Reformat tweet text (not copy-paste)
 */
function reformatText(originalText: string, hook?: string): string {
  let text = originalText.trim()

  // Remove existing hook if present
  if (!hook) {
    for (const h of HOOK_WORDS) {
      const regex = new RegExp(`^${h}:?\\s*`, 'i')
      if (regex.test(text)) {
        text = text.replace(regex, '').trim()
        break
      }
    }
  }

  // Remove all URLs (no links to external sites)
  text = removeUrls(text)

  // Clean up common patterns
  text = text
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/^["']|["']$/g, '') // Remove quotes at start/end
    .trim()

  // Reformat common phrases
  text = text
    .replace(/\bgets?\s+approval\b/gi, 'approved')
    .replace(/\bgets?\s+approved\b/gi, 'approved')
    .replace(/\bapproves?\b/gi, 'just approved')
    .replace(/\bannounces?\b/gi, 'just announced')
    .replace(/\bfiles?\s+for\b/gi, 'just filed for')

  return text
}

/**
 * Reformat a tweet from X account
 */
export function reformatTweet(tweet: XTweet): ReformattedTweet {
  const originalText = tweet.text
  const upperText = originalText.toUpperCase()

  // Check for existing hook
  const existingHook = hasHookWord(originalText)
  const hasImportant = hasImportantKeywords(originalText)
  const isUS = isUSRelated(originalText)
  const hasBreaking = existingHook === 'BREAKING' || upperText.includes('BREAKING')

  // Check if should exclude
  const exclude = shouldExclude(originalText, hasBreaking)

  // Determine hook to use
  let hook: string | undefined
  if (existingHook) {
    hook = existingHook
  } else if (hasImportant) {
    // Auto-add "JUST IN:" if no hook but has important keywords
    hook = 'JUST IN'
  }

  // Reformat text
  let formattedText = reformatText(originalText, hook)

  // Add hook prefix if we have one
  if (hook) {
    const flag = isUS ? '🇺🇸 ' : ''
    formattedText = `${hook}: ${flag}${formattedText}`
  }

  // Limit length (Twitter limit is 280, reserve space)
  const maxLength = 250
  if (formattedText.length > maxLength) {
    formattedText = formattedText.slice(0, maxLength - 3) + '...'
  }

  return {
    text: formattedText,
    hook,
    isUSRelated: isUS,
    hasImportantKeywords: hasImportant,
    shouldExclude: exclude,
    imageUrl: tweet.media_urls?.[0], // Use first image if available
    videoUrl: tweet.video_urls?.[0] // Use first video if available (priority over image)
  }
}

