import axios from 'axios'

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || ''
const HELIUS_BASE_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`

export interface WhaleTransaction {
  signature: string
  amount: number // SOL amount
  timestamp: number
  from: string
  to: string
}

/**
 * Fetch whale transactions for a token
 * Whale = transaction > 1 SOL
 */
export async function fetchWhaleTransactions(
  tokenAddress: string,
  limit: number = 3 // Reduced from 50 to 3 for free tier rate limiting
): Promise<{
  whaleCount: number
  whaleInflows: number
  totalVolume: number
}> {
  try {
    const response = await axios.post(
      HELIUS_BASE_URL,
      {
        jsonrpc: '2.0',
        id: 'whale-tracking',
        method: 'getSignaturesForAddress',
        params: [
          tokenAddress,
          {
            limit
          }
        ]
      },
      {
        timeout: 10000
      }
    )

    // Get transaction details for signatures
    const signatures = response.data.result || []
    
    if (signatures.length === 0) {
      return { whaleCount: 0, whaleInflows: 0, totalVolume: 0 }
    }

    // Fetch transaction details in smaller batches to respect rate limits
    // Helius free tier: 10 req/sec = 100ms between requests
    // For safety: process 3 transactions at a time with 500ms delay = ~2 req/sec per token
    const batchSize = 3 // Reduced from 10 to 3 for free tier
    let whaleCount = 0
    let whaleInflows = 0
    let totalVolume = 0

    for (let i = 0; i < signatures.length; i += batchSize) {
      const batch = signatures.slice(i, i + batchSize)
      
      const batchRequests = batch.map((sig: any, index: number) => ({
        jsonrpc: '2.0',
        id: `tx-${i + index}`,
        method: 'getTransaction',
        params: [
          sig.signature,
          {
            maxSupportedTransactionVersion: 0
          }
        ]
      }))

      const batchResponse = await axios.post(
        HELIUS_BASE_URL,
        batchRequests,
        {
          timeout: 15000
        }
      )

      // Process batch responses
      const results = Array.isArray(batchResponse.data) 
        ? batchResponse.data 
        : [batchResponse.data]

      for (const result of results) {
        if (result.result) {
          const tx = result.result
          // Extract SOL transfer amount from transaction
          const amount = parseTransactionAmount(tx)
          
          if (amount >= 1.0) { // Whale = 1+ SOL
            whaleCount++
            whaleInflows += amount
          }
          totalVolume += amount || 0
        }
      }

      // Rate limit: 500ms delay between batches (Helius free tier = 10 req/sec)
      // This ensures we stay well under the limit (2 req/sec per token)
      if (i + batchSize < signatures.length) {
        await new Promise(resolve => setTimeout(resolve, 500)) // Increased from 200ms
      }
    }

    return {
      whaleCount,
      whaleInflows,
      totalVolume
    }
  } catch (error: any) {
    // Handle rate limit errors gracefully (429 = Too Many Requests)
    if (error.response?.status === 429) {
      console.warn(`Helius rate limit hit for ${tokenAddress}, returning zeros`)
    } else {
      console.error('Error fetching Helius whale data:', error.message)
    }
    // Return zeros on error - graceful degradation (app continues working)
    return { whaleCount: 0, whaleInflows: 0, totalVolume: 0 }
  }
}

/**
 * Parse transaction amount from Solana transaction
 * Extracts SOL transfer amounts from balance changes
 */
function parseTransactionAmount(transaction: any): number {
  try {
    // Solana transactions have meta.preBalances and meta.postBalances
    // These are in lamports (1 SOL = 1e9 lamports)
    const meta = transaction.meta
    if (!meta) return 0

    const preBalances = meta.preBalances || []
    const postBalances = meta.postBalances || []
    
    if (preBalances.length === 0 || postBalances.length === 0) {
      return 0
    }

    // Calculate total SOL change across all accounts
    // For pump.fun, we're interested in SOL transfers (buys)
    let totalInflow = 0
    
    for (let i = 0; i < Math.min(preBalances.length, postBalances.length); i++) {
      const change = (postBalances[i] - preBalances[i]) / 1e9 // Convert lamports to SOL
      
      // Only count positive changes (inflows) and significant amounts (> 0.01 SOL)
      // Negative changes are outflows (sells), we ignore those for whale tracking
      if (change > 0.01) {
        totalInflow += change
      }
    }

    return Math.max(0, totalInflow) // Return positive flows only
  } catch (error) {
    console.warn('Error parsing transaction amount:', error)
    return 0
  }
}

/**
 * Calculate rug risk based on dev holdings
 * Check if dev wallet holds > 20% of supply
 */
export async function calculateRugRisk(tokenAddress: string): Promise<number> {
  try {
    // This would require checking token supply distribution
    // For MVP, we'll use a simplified approach
    // Real implementation would:
    // 1. Get token supply
    // 2. Check top holders
    // 3. Identify dev wallets (common patterns)
    // 4. Calculate risk score
    
    // Placeholder: return medium risk
    // TODO: Implement proper rug risk calculation
    return 50 // 0-100, where 100 = safe, 0 = high risk
  } catch (error) {
    console.error('Error calculating rug risk:', error)
    return 50 // Default medium risk
  }
}

