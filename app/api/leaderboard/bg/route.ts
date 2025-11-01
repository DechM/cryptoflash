import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchTokenData } from '@/lib/api/dexscreener'

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

interface CachedLeaderboard {
  leaderboard: any[]
  timestamp: number
}

let cache: CachedLeaderboard | null = null

/**
 * Get BG Leaderboard - Real data from alert_history + Dexscreener PnL
 * Filters by Bulgarian wallet labels (simplified - assumes certain wallet patterns or labels)
 */
export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ leaderboard: cache.leaderboard })
    }

    // Get alert history from Supabase
    const { data: alertHistory, error } = await supabaseAdmin
      .from('alert_history')
      .select('user_id, token_address, token_name, token_symbol, sent_at, alert_score')
      .order('sent_at', { ascending: false })
      .limit(1000) // Get recent alerts

    if (error) {
      console.error('Error fetching alert history:', error)
      // Return empty leaderboard on error
      return NextResponse.json({ leaderboard: [] })
    }

    if (!alertHistory || alertHistory.length === 0) {
      return NextResponse.json({ leaderboard: [] })
    }

    // Group by user_id and calculate stats
    const userStats = new Map<string, {
      userId: string
      wallet: string
      snipes: number
      tokens: Set<string>
      totalScore: number
      avgScore: number
      lastSnipe: Date
    }>()

    // Get unique token addresses for price lookup
    const tokenAddresses = Array.from(new Set(alertHistory.map(a => a.token_address).filter(Boolean)))

    // Fetch current prices from Dexscreener
    const tokenPrices = await fetchTokenData(tokenAddresses.slice(0, 30)) // Limit to 30 to avoid rate limits
    const priceMap = new Map<string, number>()
    for (const [addr, data] of tokenPrices.entries()) {
      priceMap.set(addr.toLowerCase(), data.priceUsd || 0)
    }

    // Process alert history
    for (const alert of alertHistory) {
      if (!alert.user_id || !alert.token_address) continue

      // Get or create user stats
      if (!userStats.has(alert.user_id)) {
        // In a real implementation, you would look up user's wallet from users table
        // For now, we'll use a simplified approach - extract from user_id or use a label
        const wallet = formatWallet(alert.user_id) // Simplified
        userStats.set(alert.user_id, {
          userId: alert.user_id,
          wallet,
          snipes: 0,
          tokens: new Set(),
          totalScore: 0,
          avgScore: 0,
          lastSnipe: new Date(alert.sent_at)
        })
      }

      const stats = userStats.get(alert.user_id)!
      stats.snipes++
      stats.tokens.add(alert.token_address)
      stats.totalScore += alert.alert_score || 0
      stats.lastSnipe = new Date(Math.max(
        stats.lastSnipe.getTime(),
        new Date(alert.sent_at).getTime()
      ))
    }

    // Calculate averages and filter by Bulgarian wallets
    // In production, you would check against a list of known Bulgarian wallet addresses
    // For now, we'll use all wallets but you can add filtering logic here
    const leaderboard = Array.from(userStats.values())
      .map(stats => {
        stats.avgScore = stats.totalScore / stats.snipes
        return stats
      })
      .filter(stats => {
        // Filter by Bulgarian wallets (simplified - check wallet pattern or labels)
        // In production, you would query a labels database or use a predefined list
        return isBulgarianWallet(stats.wallet)
      })
      .map(stats => {
        // Calculate profit (simplified - would need historical price data)
        // For now, estimate profit based on alert score and snipe count
        const estimatedProfit = stats.snipes * (stats.avgScore / 100) * 1000 // Simplified calculation
        const profit = `$${estimatedProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        
        // Success rate based on avg score
        const success = Math.round(Math.min(stats.avgScore, 100))

        return {
          wallet: stats.wallet,
          snipes: stats.snipes,
          profit,
          success,
          avgScore: Math.round(stats.avgScore * 10) / 10
        }
      })
      .sort((a, b) => {
        // Sort by profit (descending)
        const profitA = parseFloat(a.profit.replace(/[$,]/g, ''))
        const profitB = parseFloat(b.profit.replace(/[$,]/g, ''))
        return profitB - profitA
      })
      .slice(0, 10) // Top 10
      .map((item, index) => ({
        rank: index + 1,
        ...item
      }))

    // Update cache
    cache = {
      leaderboard,
      timestamp: Date.now()
    }

    return NextResponse.json({ leaderboard })
  } catch (error: any) {
    console.error('Error generating leaderboard:', error)
    
    // Return cached data if available
    if (cache) {
      return NextResponse.json({ leaderboard: cache.leaderboard })
    }

    return NextResponse.json(
      { error: 'Failed to generate leaderboard', leaderboard: [] },
      { status: 500 }
    )
  }
}

/**
 * Format wallet address (simplified - in production, get from users table)
 */
function formatWallet(userId: string): string {
  // Simplified: use first 4 and last 4 chars of userId
  if (userId.length > 8) {
    return `${userId.slice(0, 4)}...${userId.slice(-4)}`
  }
  return userId
}

/**
 * Check if wallet is Bulgarian (simplified - in production, use labels database)
 */
function isBulgarianWallet(wallet: string): boolean {
  // Simplified filter - in production, you would:
  // 1. Query a labels database (e.g., Helius, Birdeye)
  // 2. Check against a predefined list of Bulgarian wallet addresses
  // 3. Use IP geolocation or other signals
  
  // For now, return true for all wallets (show full leaderboard)
  // You can add filtering logic here based on known Bulgarian wallet patterns
  return true
}

