import axios from 'axios'
import { Token } from '../types'

const MORALIS_API_KEY = process.env.MORALIS_API_KEY || ''
const MORALIS_BASE_URL = 'https://solana-gateway.moralis.io'

export interface MoralisBondingToken {
  tokenAddress: string
  name: string
  symbol: string
  priceNative: number
  priceUsd?: number
  liquidity: number
  fullyDilutedValuation?: number
  // Progress is calculated from bonding curve state
}

/**
 * Fetch bonding curve tokens from Moralis
 * Returns top 100 tokens in bonding phase
 */
export async function fetchBondingTokens(): Promise<Partial<Token>[]> {
  try {
    const response = await axios.get(
      `${MORALIS_BASE_URL}/token/mainnet/exchange/pumpfun/bonding`,
      {
        params: {
          limit: 100
        },
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      }
    )

    // Transform Moralis response to our Token format
    const tokens: Partial<Token>[] = (response.data.result || []).map((token: any) => ({
      tokenAddress: token.tokenAddress || token.mint,
      name: token.name || 'Unknown',
      symbol: token.symbol || 'UNKNOWN',
      priceNative: token.priceNative || 0,
      priceUsd: token.priceUsd,
      liquidity: token.liquidity || 0,
      fullyDilutedValuation: token.fullyDilutedValuation,
      progress: token.progress || calculateProgressFromLiquidity(token),
      createdAt: new Date().toISOString()
    }))

    return tokens
  } catch (error: any) {
    console.error('Error fetching Moralis bonding tokens:', error.message)
    throw new Error(`Failed to fetch bonding tokens: ${error.message}`)
  }
}

/**
 * Calculate bonding curve progress from liquidity
 * This is an approximation - Moralis might provide progress directly
 */
function calculateProgressFromLiquidity(token: any): number {
  // Pump.fun bonding curve typically completes around 70-80 SOL liquidity
  // This is an estimate - adjust based on actual pump.fun mechanics
  const maxLiquidity = 80 // Approximate SOL needed for full bonding
  const currentLiquidity = token.liquidity || 0
  return Math.min((currentLiquidity / maxLiquidity) * 100, 99.9) // Cap at 99.9% until graduated
}

