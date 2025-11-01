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

    // Check if pro and not expired
    if (user.subscription_status === 'pro') {
      if (user.subscription_expires_at) {
        const expiresAt = new Date(user.subscription_expires_at)
        const now = new Date()

        if (expiresAt > now) {
          return 'pro' // Active subscription
        } else {
          // Subscription expired, auto-update to free
          await supabaseAdmin
            .from('users')
            .update({ subscription_status: 'free' })
            .eq('id', userId)
          return 'free'
        }
      }
      // Pro but no expiry date (shouldn't happen, but handle gracefully)
      return 'pro'
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
  return tier === 'pro' ? 85 : 95
}

/**
 * Get max active alerts based on user tier
 */
export function getMaxActiveAlerts(tier: SubscriptionTier): number {
  return tier === 'pro' ? Infinity : 1
}

/**
 * Get max daily alerts based on user tier
 */
export function getMaxDailyAlerts(tier: SubscriptionTier): number {
  return tier === 'pro' ? Infinity : 10
}

/**
 * Get refresh interval (milliseconds) based on user tier
 */
export function getRefreshInterval(tier: SubscriptionTier): number {
  return tier === 'pro' ? 15000 : 60000 // 15s for pro, 60s for free
}

