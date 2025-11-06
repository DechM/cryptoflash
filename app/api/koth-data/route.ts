import { NextResponse } from 'next/server'
import { fetchBondingTokens } from '@/lib/api/moralis'
import { fetchTokenData } from '@/lib/api/dexscreener'
import { fetchWhaleTransactions, calculateRugRisk } from '@/lib/api/helius'
import { calculateTokenScore } from '@/lib/score'
import { Token } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { generateMockTokens, shouldUseMockData } from '@/lib/mock-data'

// Cache duration: 30 seconds
const CACHE_DURATION = 30 * 1000

interface CachedData {
  tokens: Token[]
  timestamp: number
}

let cache: CachedData | null = null

// Whale data cache (separate from main cache) - 3 minutes
const WHALE_CACHE_DURATION = 3 * 60 * 1000

interface WhaleCache {
  data: Map<string, { whaleCount: number; whaleInflows: number; totalVolume: number }>
  timestamp: number
}

let whaleCache: WhaleCache | null = null

export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ tokens: cache.tokens })
    }

    // Use mock data if API keys are missing
    if (shouldUseMockData()) {
      console.log('Using mock data - API keys not configured')
      const mockTokens = generateMockTokens()
      cache = {
        tokens: mockTokens,
        timestamp: Date.now()
      }
      return NextResponse.json({ tokens: mockTokens })
    }

    // Fetch bonding tokens from Moralis
    let bondingTokens: Partial<Token>[] = []
    try {
      bondingTokens = await fetchBondingTokens()
    } catch (error: any) {
      console.error('Moralis API failed, using mock data:', error.message)
      const mockTokens = generateMockTokens()
      cache = {
        tokens: mockTokens,
        timestamp: Date.now()
      }
      return NextResponse.json({ tokens: mockTokens })
    }
    
    // Filter tokens with progress > 90% (KOTH candidates)
    const kothCandidates = bondingTokens.filter(t => (t.progress || 0) >= 90)
    
    // Get token addresses for batch fetching
    const tokenAddresses = kothCandidates
      .map(t => t.tokenAddress)
      .filter((addr): addr is string => !!addr)

    // CHECK WHALE CACHE BEFORE Promise.all (FIX)
    // This prevents whale tracking from being called every time main cache expires (30s)
    let cachedWhaleData: Array<{ whaleCount: number; whaleInflows: number; totalVolume: number }> | null = null
    const whaleTrackingEnabled = process.env.ENABLE_WHALE_TRACKING === 'true'
    
    if (whaleCache && Date.now() - whaleCache.timestamp < WHALE_CACHE_DURATION) {
      const cacheAge = Math.round((Date.now() - whaleCache.timestamp) / 1000)
      console.log(`✅ Using cached whale data (cache age: ${cacheAge}s)`)
      cachedWhaleData = tokenAddresses.map(addr => 
        whaleCache!.data.get(addr) || { whaleCount: 0, whaleInflows: 0, totalVolume: 0 }
      )
    } else if (!whaleTrackingEnabled) {
      console.log('⚠️ Whale tracking disabled (ENABLE_WHALE_TRACKING != true) - returning zeros')
      cachedWhaleData = tokenAddresses.map(() => ({ whaleCount: 0, whaleInflows: 0, totalVolume: 0 }))
      // Cache zeros too (to avoid checking env var every time)
      whaleCache = {
        data: new Map(tokenAddresses.map((addr, idx) => [addr, cachedWhaleData![idx]])),
        timestamp: Date.now()
      }
    } else {
      console.log('🔄 Fetching fresh whale data (cache expired or not set)')
    }

    // Fetch additional data in parallel
    const [dexscreenerData, whaleData] = await Promise.all([
      fetchTokenData(tokenAddresses),
      // Use cached data if available, otherwise fetch
      cachedWhaleData 
        ? Promise.resolve(cachedWhaleData)
        : (async () => {
            console.log(`🚀 Starting whale tracking for ${tokenAddresses.length} tokens (top 30 will be tracked)`)
            
            // OPTIMIZATION: Only track whales for top 30 tokens (highest progress)
            // This reduces API calls while maintaining good coverage
            const sortedTokens = kothCandidates
              .map((t, idx) => ({ token: t, address: tokenAddresses[idx] }))
              .filter(item => item.address)
              .sort((a, b) => (b.token.progress || 0) - (a.token.progress || 0))
              .slice(0, 30) // Only top 30 tokens
            
            const topTokenAddresses = sortedTokens.map(item => item.address!)
            console.log(`📊 Tracking whales for top ${topTokenAddresses.length} tokens`)

            const whaleResults: Array<{ whaleCount: number; whaleInflows: number; totalVolume: number }> = []
            
            // Process 1 token at a time with 1.5s delay = ~0.67 req/sec (well under 10 req/sec)
            // 30 tokens × 1.5s = 45s total, 60 requests (30 getSignatures + 30 getTransaction batches) = 1.33 req/sec ✅
            for (let i = 0; i < topTokenAddresses.length; i++) {
              const addr = topTokenAddresses[i]
              
              try {
                // Fetch 2 signatures per token (better whale detection than 1)
                const result = await fetchWhaleTransactions(addr, 2)
                whaleResults.push(result)
                if (result.whaleCount > 0) {
                  console.log(`🐋 Found ${result.whaleCount} whale(s) for ${addr.substring(0, 8)}... (${result.whaleInflows.toFixed(2)} SOL)`)
                }
              } catch (error) {
                console.warn(`❌ Error fetching whale data for ${addr}:`, error)
                whaleResults.push({ whaleCount: 0, whaleInflows: 0, totalVolume: 0 })
              }
              
              // Rate limit: 1.5s delay between tokens
              // This ensures we stay well under Helius free tier limit (10 req/sec)
              if (i + 1 < topTokenAddresses.length) {
                await new Promise(resolve => setTimeout(resolve, 1500))
              }
            }
            
            // Map results back to all tokens (top 30 have data, rest are zeros)
            const whaleDataMap = new Map<string, { whaleCount: number; whaleInflows: number; totalVolume: number }>()
            sortedTokens.forEach((item, idx) => {
              whaleDataMap.set(item.address!, whaleResults[idx] || { whaleCount: 0, whaleInflows: 0, totalVolume: 0 })
            })
            
            const finalResults = tokenAddresses.map(addr => 
              whaleDataMap.get(addr) || { whaleCount: 0, whaleInflows: 0, totalVolume: 0 }
            )
            
            // Cache the results (3 min cache)
            whaleCache = {
              data: new Map(tokenAddresses.map((addr, idx) => [addr, finalResults[idx]])),
              timestamp: Date.now()
            }
            
            const totalWhales = finalResults.reduce((sum, r) => sum + r.whaleCount, 0)
            console.log(`✅ Whale tracking complete. Total whales found: ${totalWhales} across ${topTokenAddresses.length} tokens`)
            
            return finalResults
          })()
    ])

    // Calculate scores and enrich tokens (async map for rug risk calculation)
    const enrichedTokensPromises = kothCandidates
      .filter(token => token.tokenAddress) // Filter out tokens without address
      .map(async (token, index) => {
        const dexData = dexscreenerData.get(token.tokenAddress!) || {}
        const whaleInfo = whaleData[index] || { whaleCount: 0, whaleInflows: 0, totalVolume: 0 }
        
        // Calculate volume jump (percentage change in 24h)
        const volumeJump = dexData.priceChange24h || 0

        // Calculate curve speed (0-10 scale)
        // Speed is based on volume relative to liquidity + progress momentum
        // Higher volume/liquidity ratio = faster curve progression
        const liquidityInSOL = token.liquidity || 0
        const priceUsd = Math.max(token.priceUsd || dexData.priceUsd || 0.000001, 0.000001)
        const volumeInSOL = (dexData.volume24h || 0) / priceUsd // Approximate SOL volume
        const volumeToLiquidityRatio = liquidityInSOL > 0 ? volumeInSOL / liquidityInSOL : 0
        // Normalize to 0-10: higher ratio = faster speed
        // Also factor in progress - tokens closer to 100% tend to have faster speed
        const progressMultiplier = 1 + (token.progress || 0) / 100
        const curveSpeed = Math.min(Math.max(volumeToLiquidityRatio * 5 * progressMultiplier, 0), 10)

        // Calculate rug risk (async - may take time)
        let rugRisk = 50 // Default medium risk
        try {
          rugRisk = await calculateRugRisk(token.tokenAddress!)
        } catch (error) {
          // Use default if calculation fails
          console.warn(`Failed to calculate rug risk for ${token.tokenAddress}:`, error)
        }

        // Calculate score using the new formula
        const score = calculateTokenScore({
          ...token,
          curveSpeed,
          volumeChange24h: volumeJump,
          whaleInflows: whaleInfo.whaleInflows,
          rugRisk
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
          curveSpeed,
          score,
          whaleCount: whaleInfo.whaleCount,
          whaleInflows: whaleInfo.whaleInflows,
          hypeScore: undefined, // Not using Grok for MVP
          rugRisk,
          fullyDilutedValuation: token.fullyDilutedValuation,
          marketCap: dexData.fdv,
          createdAt: new Date().toISOString()
        }
      })
    
    // Wait for all async operations to complete
    const enrichedTokens: Token[] = await Promise.all(enrichedTokensPromises)

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


