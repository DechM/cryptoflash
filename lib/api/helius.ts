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
  limit: number = 50
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

    // Fetch transaction details in batches
    const batchSize = 10
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
          // Extract transfer amount (simplified - actual parsing depends on tx structure)
          // For pump.fun, we need to parse the transaction to get SOL amount
          // This is a simplified version - actual implementation needs proper Solana tx parsing
          const amount = parseTransactionAmount(tx)
          
          if (amount >= 1.0) { // Whale = 1+ SOL
            whaleCount++
            whaleInflows += amount
          }
          totalVolume += amount || 0
        }
      }

      // Rate limit: Helius allows 10 req/sec for RPC
      if (i + batchSize < signatures.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
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
 * Simplified version - actual implementation needs proper parsing
 */
function parseTransactionAmount(transaction: any): number {
  // This is a simplified parser
  // Real implementation needs to:
  // 1. Parse instruction data
  // 2. Extract SOL transfer amounts
  // 3. Handle pump.fun specific instructions
  
  try {
    // Attempt to extract from pre/post token balances or instructions
    // For now, return 0 as placeholder
    // TODO: Implement proper Solana transaction parsing
    return 0
  } catch {
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

