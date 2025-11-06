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
 * Whale = transaction >= 0.5 SOL (reduced from 1 SOL for pump.fun tokens)
 */
export async function fetchWhaleTransactions(
  tokenAddress: string,
  limit: number = 2 // 2 signatures for better whale detection (optimized for 900k/month limit)
): Promise<{
  whaleCount: number
  whaleInflows: number
  totalVolume: number
}> {
  console.log(`🔍 [HELIUS START] fetchWhaleTransactions called for ${tokenAddress.substring(0, 12)}... with limit=${limit}`)
  console.log(`🔧 HELIUS_API_KEY exists: ${!!HELIUS_API_KEY}`)
  console.log(`🔧 HELIUS_BASE_URL: ${HELIUS_BASE_URL.substring(0, 50)}...`)
  
  // Skip if no API key
  if (!HELIUS_API_KEY || HELIUS_API_KEY === '') {
    console.warn(`⚠️ [HELIUS] No API key, returning zeros for ${tokenAddress.substring(0, 12)}...`)
    return { whaleCount: 0, whaleInflows: 0, totalVolume: 0 }
  }

  try {
    console.log(`📡 [HELIUS] Calling getSignaturesForAddress for ${tokenAddress.substring(0, 12)}...`)
    // Get signatures (limit = 2)
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
        timeout: 8000
      }
    )

    // Check for RPC errors in response
    if (response.data.error) {
      console.warn(`Helius RPC error for ${tokenAddress}:`, response.data.error.message)
      return { whaleCount: 0, whaleInflows: 0, totalVolume: 0 }
    }

    // Get transaction details for signatures
    const signatures = response.data.result || []
    
    console.log(`🔍 Helius: Found ${signatures.length} signatures for ${tokenAddress.substring(0, 12)}...`)
    
    if (signatures.length === 0) {
      console.log(`⚠️ Helius: No signatures found for ${tokenAddress.substring(0, 12)}...`)
      return { whaleCount: 0, whaleInflows: 0, totalVolume: 0 }
    }

    // Fetch transaction details for signatures (batch request - only 2 transactions)
    const batchRequests = signatures.map((sig: any, index: number) => ({
      jsonrpc: '2.0',
      id: `tx-${index}`,
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
        timeout: 8000
      }
    )

    // Check for RPC errors in batch response
    const batchResults = Array.isArray(batchResponse.data) 
      ? batchResponse.data 
      : [batchResponse.data]
    
    // Check if any request in batch failed
    const hasErrors = batchResults.some((r: any) => r.error)
    if (hasErrors) {
      console.warn(`Helius batch request errors for ${tokenAddress}, processing valid results only`)
    }

    // Process transactions
    let whaleCount = 0
    let whaleInflows = 0
    let totalVolume = 0

    for (const result of batchResults) {
      if (result.error) {
        console.warn(`⚠️ Helius: Transaction error for ${tokenAddress.substring(0, 12)}...:`, result.error)
        continue // Skip failed requests
      }
      
      if (result.result) {
        const tx = result.result
        // Extract SOL transfer amount from transaction
        const amount = parseTransactionAmount(tx)
        
        // Detailed logging
        if (amount > 0) {
          console.log(`💰 Helius: Parsed amount for ${tokenAddress.substring(0, 12)}...: ${amount.toFixed(4)} SOL`)
        }
        
        if (amount >= 0.5) { // Whale = 0.5+ SOL (reduced from 1 SOL for pump.fun tokens)
          whaleCount++
          whaleInflows += amount
          console.log(`🐋 Helius: WHALE DETECTED! ${amount.toFixed(2)} SOL for ${tokenAddress.substring(0, 12)}...`)
        } else if (amount > 0) {
          console.log(`💧 Helius: Small transaction ${amount.toFixed(4)} SOL (< 0.5 SOL threshold) for ${tokenAddress.substring(0, 12)}...`)
        }
        
        totalVolume += amount || 0
      } else {
        console.warn(`⚠️ Helius: No result in transaction for ${tokenAddress.substring(0, 12)}...`)
      }
    }

    console.log(`📊 Helius: Final result for ${tokenAddress.substring(0, 12)}...: whales=${whaleCount}, inflows=${whaleInflows.toFixed(2)} SOL, volume=${totalVolume.toFixed(2)} SOL`)

    return {
      whaleCount,
      whaleInflows,
      totalVolume
    }
  } catch (error: any) {
    // Handle rate limit errors gracefully (429 = Too Many Requests)
    if (error.response?.status === 429) {
      console.warn(`Helius rate limit hit for ${tokenAddress}, returning zeros`)
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // Timeout - don't log as error, just return zeros
      console.warn(`Helius timeout for ${tokenAddress}, returning zeros`)
    } else if (error.message?.includes('Request fail') || error.message?.includes('Network')) {
      // Network errors - don't spam logs
      console.warn(`Helius network error for ${tokenAddress}, returning zeros`)
    } else {
      // Only log unexpected errors
      console.error('Error fetching Helius whale data:', error.message || error.code)
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
    if (!meta) {
      console.warn('⚠️ parseTransactionAmount: No meta in transaction')
      return 0
    }

    const preBalances = meta.preBalances || []
    const postBalances = meta.postBalances || []
    
    if (preBalances.length === 0 || postBalances.length === 0) {
      console.warn('⚠️ parseTransactionAmount: Empty balances (pre:', preBalances.length, 'post:', postBalances.length, ')')
      return 0
    }

    // Calculate total SOL change across all accounts
    // For pump.fun, we're interested in SOL transfers (buys)
    let totalInflow = 0
    let balanceChanges: number[] = []
    
    for (let i = 0; i < Math.min(preBalances.length, postBalances.length); i++) {
      const change = (postBalances[i] - preBalances[i]) / 1e9 // Convert lamports to SOL
      
      // Only count positive changes (inflows) and significant amounts (> 0.01 SOL)
      // Negative changes are outflows (sells), we ignore those for whale tracking
      if (change > 0.01) {
        totalInflow += change
        balanceChanges.push(change)
      }
    }

    if (balanceChanges.length > 0) {
      console.log(`  💵 parseTransactionAmount: ${balanceChanges.length} balance changes, total: ${totalInflow.toFixed(4)} SOL`)
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

