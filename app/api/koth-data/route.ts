import { NextResponse } from 'next/server'
import { fetchBondingTokens } from '@/lib/api/moralis'
import { fetchTokenData } from '@/lib/api/dexscreener'
import { fetchWhaleTransactions, calculateRugRisk } from '@/lib/api/helius'
import { calculateTokenScore } from '@/lib/score'
import { Token } from '@/lib/types'
import { supabase } from '@/lib/supabase'

// Cache duration: 30 seconds
const CACHE_DURATION = 30 * 1000

interface CachedData {
  tokens: Token[]
  timestamp: number
}

let cache: CachedData | null = null

export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ tokens: cache.tokens })
    }

    // Fetch bonding tokens from Moralis
    const bondingTokens = await fetchBondingTokens()
    
    // Filter tokens with progress > 90% (KOTH candidates)
    const kothCandidates = bondingTokens.filter(t => (t.progress || 0) >= 90)
    
    // Get token addresses for batch fetching
    const tokenAddresses = kothCandidates
      .map(t => t.tokenAddress)
      .filter((addr): addr is string => !!addr)

    // Fetch additional data in parallel
    const [dexscreenerData, whaleData] = await Promise.all([
      fetchTokenData(tokenAddresses),
      Promise.all(
        tokenAddresses.map(addr => fetchWhaleTransactions(addr))
      )
    ])

    // Calculate scores and enrich tokens
    const enrichedTokens: Token[] = kothCandidates
      .filter(token => token.tokenAddress) // Filter out tokens without address
      .map((token, index) => {
        const dexData = dexscreenerData.get(token.tokenAddress!) || {}
        const whaleInfo = whaleData[index] || { whaleCount: 0, whaleInflows: 0, totalVolume: 0 }
        
        // Calculate volume jump (simplified - compare with average)
        const volumeJump = dexData.priceChange24h || 0

        // Calculate score
        const score = calculateTokenScore({
          ...token,
          volumeChange24h: volumeJump,
          whaleInflows: whaleInfo.whaleInflows,
          rugRisk: 50 // Default, will be calculated properly later
        })

        return {
          tokenAddress: token.tokenAddress!,
          name: token.name || 'Unknown',
          symbol: token.symbol || 'UNKNOWN',
          progress: token.progress || 0,
          priceNative: token.priceNative || 0,
          priceUsd: dexData.priceUsd,
          liquidity: token.liquidity || 0,
          volume24h: dexData.volume24h,
          volumeChange24h: volumeJump,
          score,
          whaleCount: whaleInfo.whaleCount,
          whaleInflows: whaleInfo.whaleInflows,
          hypeScore: undefined, // Not using Grok for MVP
          rugRisk: 50, // Default medium risk
          fullyDilutedValuation: token.fullyDilutedValuation,
          marketCap: dexData.fdv,
          createdAt: new Date().toISOString()
        }
      })

    // Sort by score (highest first)
    enrichedTokens.sort((a, b) => b.score - a.score)

    // Take top 50
    const topTokens = enrichedTokens.slice(0, 50)

    // Update cache
    cache = {
      tokens: topTokens,
      timestamp: Date.now()
    }

    // Optionally save to Supabase for persistence
    try {
      // Store in Supabase for historical tracking
      await supabase
        .from('koth_tokens')
        .upsert(
          topTokens.map(t => ({
            token_address: t.tokenAddress,
            name: t.name,
            symbol: t.symbol,
            progress: t.progress,
            score: t.score,
            data: t,
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'token_address' }
        )
    } catch (dbError) {
      // Don't fail if DB write fails
      console.error('Error saving to database:', dbError)
    }

    return NextResponse.json({ tokens: topTokens })
  } catch (error: any) {
    console.error('Error fetching KOTH data:', error)
    
    // Return cached data if available, even if expired
    if (cache) {
      return NextResponse.json({ tokens: cache.tokens })
    }

    return NextResponse.json(
      { error: 'Failed to fetch KOTH data', tokens: [] },
      { status: 500 }
    )
  }
}

