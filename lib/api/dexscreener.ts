import axios from 'axios'

const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest/dex'

export interface DexscreenerTokenData {
  priceUsd?: number
  volume24h?: number
  priceChange24h?: number
  liquidity?: number
  fdv?: number
}

/**
 * Fetch token data from Dexscreener
 * @param tokenAddresses Comma-separated list of token addresses (max 30)
 */
export async function fetchTokenData(
  tokenAddresses: string[]
): Promise<Map<string, DexscreenerTokenData>> {
  try {
    // Dexscreener allows up to 30 addresses per request
    const chunks = []
    for (let i = 0; i < tokenAddresses.length; i += 30) {
      chunks.push(tokenAddresses.slice(i, i + 30))
    }

    const results = new Map<string, DexscreenerTokenData>()

    for (const chunk of chunks) {
      const addresses = chunk.join(',')
      const response = await axios.get(
        `${DEXSCREENER_BASE_URL}/tokens/${addresses}`,
        {
          timeout: 10000
        }
      )

      // Process response
      if (response.data.pairs && Array.isArray(response.data.pairs)) {
        for (const pair of response.data.pairs) {
          const tokenAddress = chunk.find(addr => 
            pair.baseToken?.address?.toLowerCase() === addr.toLowerCase()
          )

          if (tokenAddress) {
            const existing = results.get(tokenAddress) || {}
            results.set(tokenAddress, {
              priceUsd: pair.priceUsd || existing.priceUsd,
              volume24h: pair.volume?.h24 || existing.volume24h,
              priceChange24h: pair.priceChange?.h24 || existing.priceChange24h,
              liquidity: pair.liquidity?.usd || existing.liquidity,
              fdv: pair.fdv || existing.fdv
            })
          }
        }
      }

      // Rate limit: ~100 requests/min, so add small delay
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  } catch (error: any) {
    console.error('Error fetching Dexscreener data:', error.message)
    // Return empty map on error - don't fail completely
    return new Map()
  }
}

