import axios from 'axios'
import { Token } from '../types'

const MORALIS_API_KEYS = (process.env.MORALIS_API_KEYS || process.env.MORALIS_API_KEY || '')
  .split(',')
  .map(key => key.trim())
  .filter(Boolean)
const MORALIS_BASE_URL = 'https://solana-gateway.moralis.io'

let moralisDisabledUntil: number | null = null
let currentKeyIndex = 0

function getCurrentMoralisKey(): string | null {
  if (!MORALIS_API_KEYS.length) {
    return null
  }
  return MORALIS_API_KEYS[currentKeyIndex % MORALIS_API_KEYS.length]
}

function goToNextMoralisKey() {
  if (MORALIS_API_KEYS.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % MORALIS_API_KEYS.length
    console.warn(`[Moralis] Switching to backup key (index ${currentKeyIndex + 1}/${MORALIS_API_KEYS.length})`)
  }
}

export interface MoralisBondingToken {
  tokenAddress: string
  mint?: string
  name: string
  symbol: string
  priceNative: number
  progress?: number
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
  let activeKey = getCurrentMoralisKey()
  if (!activeKey) {
    throw new Error('Moralis API key not configured')
  }

  if (moralisDisabledUntil && Date.now() < moralisDisabledUntil) {
    const resume = new Date(moralisDisabledUntil).toISOString()
    throw new Error(`Moralis temporarily disabled until ${resume}`)
  }

  const endpoints = [
    '/token/mainnet/exchange/pumpfun/bonding',
    '/token/exchange/pumpfun/bonding'
  ]

  let lastError: Error | null = null

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(
        `${MORALIS_BASE_URL}${endpoint}`,
        {
          params: { limit: 100 },
          headers: {
            'X-API-Key': activeKey,
            'Accept': 'application/json'
          },
          timeout: 8000
        }
      )

      const payload = response.data?.result as MoralisBondingToken[] | undefined
      if (!Array.isArray(payload) || payload.length === 0) {
        throw new Error('Unexpected Moralis response format')
      }

      return payload.map((token: MoralisBondingToken) => ({
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
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number }; message?: string }
      const status = axiosError.response?.status
      lastError = new Error(axiosError?.message ?? (err instanceof Error ? err.message : String(err)))

      if (status === 401 || status === 403 || status === 429) {
        moralisDisabledUntil = Date.now() + 60 * 60 * 1000
        console.warn(`[Moralis] Disabling requests for 60 minutes (status ${status})`)
        goToNextMoralisKey()
        activeKey = getCurrentMoralisKey() || activeKey
        break
      }

      if (status === 500 || status === 502 || status === 503) {
        goToNextMoralisKey()
        activeKey = getCurrentMoralisKey() || activeKey
      } else {
        console.warn(`[Moralis] Endpoint ${endpoint} failed (status ${status ?? 'unknown'}). Trying next...`)
      }
    }
  }

  if (lastError) {
    throw lastError
  }

  throw new Error('Moralis returned no data')
}

/**
 * Calculate bonding curve progress from liquidity
 * This is an approximation - Moralis might provide progress directly
 */
function calculateProgressFromLiquidity(token: { liquidity?: number }): number {
  // Pump.fun bonding curve typically completes around 70-80 SOL liquidity
  // This is an estimate - adjust based on actual pump.fun mechanics
  const maxLiquidity = 80 // Approximate SOL needed for full bonding
  const currentLiquidity = token.liquidity || 0
  return Math.min((currentLiquidity / maxLiquidity) * 100, 99.9) // Cap at 99.9% until graduated
}

