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
 * Changes structure and phrasing to avoid 1:1 copying while preserving meaning
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

  // Reformat common phrases (expanded list for better variation)
  text = text
    // Approval/decision phrases
    .replace(/\bgets?\s+approval\b/gi, 'approved')
    .replace(/\bgets?\s+approved\b/gi, 'approved')
    .replace(/\bapproves?\b/gi, 'just approved')
    .replace(/\bapproval\s+for\b/gi, 'approval of')
    .replace(/\bdenies?\b/gi, 'just denied')
    .replace(/\brejects?\b/gi, 'rejected')
    .replace(/\baccepted\b/gi, 'just accepted')
    
    // Announcement phrases
    .replace(/\bannounces?\b/gi, 'just announced')
    .replace(/\bannouncement\s+by\b/gi, 'announcement from')
    .replace(/\bannouncement\s+from\b/gi, 'announcement by')
    .replace(/\breveals?\b/gi, 'revealed')
    .replace(/\bconfirms?\b/gi, 'confirmed')
    .replace(/\bdenies?\b/gi, 'denied')
    
    // Reporting phrases - but preserve subject before "says/said"
    // Pattern: "X says Y" -> keep "X says Y" (don't change "says" if there's a subject before it)
    // Only change standalone "reports/states" without subject
    .replace(/\b([A-Z][a-zA-Z\s]+?)\s+says\s+/gi, '$1 says ') // Preserve "X says"
    .replace(/\b([A-Z][a-zA-Z\s]+?)\s+said\s+/gi, '$1 said ') // Preserve "X said"
    .replace(/\breports?\b/gi, 'just reported')
    .replace(/\bstates?\b/gi, 'stated')
    .replace(/\bclaims?\b/gi, 'claimed')
    .replace(/\badds?\b/gi, 'added')
    .replace(/\bnotes?\b/gi, 'noted')
    .replace(/\bexplains?\b/gi, 'explained')
    
    // Action phrases
    .replace(/\bfiles?\s+for\b/gi, 'just filed for')
    .replace(/\bfiles?\s+a\b/gi, 'filed a')
    .replace(/\bseeks?\b/gi, 'seeking')
    .replace(/\brequests?\b/gi, 'requested')
    .replace(/\basks?\b/gi, 'asked')
    .replace(/\burges?\b/gi, 'urged')
    .replace(/\bcalls?\s+for\b/gi, 'calling for')
    .replace(/\bcalls?\s+on\b/gi, 'calling on')
    
    // Warning/prediction phrases
    .replace(/\bwarns?\b/gi, 'warned')
    .replace(/\bpredicts?\b/gi, 'predicted')
    .replace(/\bsuggests?\b/gi, 'suggested')
    .replace(/\bexpects?\b/gi, 'expected')
    
    // Structural changes (remove/add articles without changing meaning)
    .replace(/\bapplication\s+from\b/gi, "application")
    .replace(/\bfrom\s+([A-Z][a-z]+)\s+application\b/gi, "$1's application")
    .replace(/\bby\s+([A-Z][a-z]+)\s+announcement\b/gi, "$1 announcement")
    .replace(/\bthe\s+([A-Z][a-z]+)\s+just\s+approved\b/gi, '$1 just approved')
    .replace(/\ba\s+new\s+/gi, 'new ')
    .replace(/\bthe\s+new\s+/gi, 'new ')
    
    // Remove filler phrases that don't change meaning
    .replace(/\bthis\s+is\s+a\s+/gi, '')
    .replace(/\bthis\s+is\s+/gi, '')
    .replace(/\bit\s+is\s+a\s+/gi, '')
    .replace(/\bit\s+is\s+/gi, '')
    .replace(/\baccording\s+to\s+/gi, '')
    .replace(/\bas\s+reported\s+by\s+/gi, '')
    .replace(/\bas\s+per\s+/gi, '')

  // Clean up multiple spaces again after replacements
  text = text.replace(/\s+/g, ' ').trim()
  
  // Remove trailing punctuation that might be left after cleanup
  text = text.replace(/\s*[,;]\s*$/, '')

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

