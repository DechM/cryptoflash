import { supabaseAdmin } from './supabase'
import { SubscriptionTier } from './types'

/**
 * Get user subscription tier from database
 * Always checks expiration date
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('subscription_status, subscription_expires_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return 'free'
    }

    // Check if pro/ultimate and not expired
    if (user.subscription_status === 'pro' || user.subscription_status === 'ultimate') {
      if (user.subscription_expires_at) {
        const expiresAt = new Date(user.subscription_expires_at)
        const now = new Date()

        if (expiresAt > now) {
          return user.subscription_status // Active subscription
        } else {
          // Subscription expired, auto-update to free
          await supabaseAdmin
            .from('users')
            .update({ subscription_status: 'free' })
            .eq('id', userId)
          return 'free'
        }
      }
      // Subscription but no expiry date (shouldn't happen, but handle gracefully)
      return user.subscription_status
    }

    return user.subscription_status || 'free'
  } catch (error) {
    console.error('Error getting user tier:', error)
    return 'free' // Fail safe
  }
}

/**
 * Check if user has Pro subscription
 */
export async function isProUser(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId)
  return tier === 'pro'
}

/**
 * Get alert threshold based on user tier
 */
export function getAlertThreshold(tier: SubscriptionTier): number {
  if (tier === 'ultimate') return 80 // Ultimate gets earliest alerts
  if (tier === 'pro') return 85
  return 95 // Free
}

/**
 * Get max active alerts based on user tier
 */
export function getMaxActiveAlerts(tier: SubscriptionTier): number {
  if (tier === 'ultimate') return Infinity
  if (tier === 'pro') return 10 // Pro can track 10 tokens
  return 1 // Free: 1 token
}

/**
 * Get max daily alerts based on user tier
 */
export function getMaxDailyAlerts(tier: SubscriptionTier): number {
  if (tier === 'ultimate') return Infinity
  if (tier === 'pro') return 100
  return 10 // Free: 10/day
}

/**
 * Get refresh interval (milliseconds) based on user tier
 */
export function getRefreshInterval(tier: SubscriptionTier): number {
  if (tier === 'ultimate') return 10000 // 10s for ultimate
  if (tier === 'pro') return 15000 // 15s for pro
  return 60000 // 60s for free
}

/**
 * Check if user has Pro or Ultimate subscription
 */
export async function isProOrUltimateUser(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId)
  return tier === 'pro' || tier === 'ultimate'
}

/**
 * Check if user has Ultimate subscription
 */
export async function isUltimateUser(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId)
  return tier === 'ultimate'
}

