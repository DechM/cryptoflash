// Blockchain transaction monitoring with FREE APIs only
import type { CryptoFlashAlert, Blockchain, AlertType, KnownLabel } from './types';
import { KNOWN_EXCHANGES, ALERT_THRESHOLDS } from './types';

// Rate limiter for API calls
class RateLimiter {
  private calls: Map<string, number[]> = new Map();
  private maxCalls: number;
  private windowMs: number;

  constructor(maxCalls: number, windowMs: number) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  canMakeCall(key: string): boolean {
    const now = Date.now();
    const calls = this.calls.get(key) || [];
    
    // Remove calls outside the window
    const recentCalls = calls.filter(time => now - time < this.windowMs);
    
    if (recentCalls.length >= this.maxCalls) {
      return false;
    }
    
    recentCalls.push(now);
    this.calls.set(key, recentCalls);
    return true;
  }
}

// Rate limiters per API
const etherscanLimiter = new RateLimiter(5, 1000); // 5 calls per second (free tier)
const blockstreamLimiter = new RateLimiter(1, 1000); // 1 call per second (conservative)

/**
 * Fetch large Ethereum transactions from Etherscan (FREE API)
 * COMBINED APPROACH: Block scanning + Whale addresses for maximum coverage
 * Gets latest blocks AND checks known whale addresses
 */
export async function fetchLargeEthereumTransactions(
  minAmountUsd: number = 0  // Default $0 to get all transactions
): Promise<CryptoFlashAlert[]> {
  if (!etherscanLimiter.canMakeCall('etherscan')) {
    console.log('Rate limited: Etherscan');
    return [];
  }

  try {
    const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
    
    // Check if API key is set
    if (apiKey === 'YourApiKeyToken') {
      console.warn('[Etherscan] ⚠️ ETHERSCAN_API_KEY не е зададен! API calls няма да работят.');
      return []; // Return early if no API key
    }
    
    const alerts: CryptoFlashAlert[] = [];
    
    // Fetch ETH price ONCE before processing (save API calls)
    let ethPriceUsd = 3000; // Fallback price
    try {
      const priceResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { next: { revalidate: 60 } }
      );
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        ethPriceUsd = priceData.ethereum?.usd || 3000;
        console.log(`[Etherscan] ETH price: $${ethPriceUsd}`);
      }
    } catch (e) {
      console.error('[Etherscan] Failed to fetch ETH price:', e);
    }

    // Step 1: Get latest block number
    if (!etherscanLimiter.canMakeCall('etherscan')) {
      console.log('[Etherscan] Rate limited before getting block number');
      return [];
    }

    const blockNumberResponse = await fetch(
      `https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_blockNumber&apikey=${apiKey}`,
      { next: { revalidate: 15 } }
    );

    if (!blockNumberResponse.ok) {
      console.error('[Etherscan] Failed to get latest block number:', blockNumberResponse.status);
      return [];
    }

    const blockNumberData = await blockNumberResponse.json();
    
    // V2 proxy endpoints return JSON-RPC format: {jsonrpc: "2.0", id: X, result: "0x..."}
    // NOT the standard Etherscan format: {status: "1", message: "OK", result: "0x..."}
    let latestBlockHex: string;
    if (blockNumberData.jsonrpc && blockNumberData.result) {
      // JSON-RPC format (V2 proxy endpoint)
      latestBlockHex = blockNumberData.result;
    } else if (blockNumberData.status === '1' && blockNumberData.result) {
      // Standard Etherscan format (fallback)
      latestBlockHex = blockNumberData.result;
    } else {
      console.error('[Etherscan] Block number API error:', blockNumberData.message || blockNumberData.error || 'Unknown');
      console.error('[Etherscan] Full response:', JSON.stringify(blockNumberData, null, 2));
      return [];
    }

    const latestBlock = parseInt(latestBlockHex, 16);
    console.log(`[Etherscan] ✅ Latest block: ${latestBlock} (hex: ${latestBlockHex})`);

    // Step 2: Scan last 150 blocks for large transactions (about 30 minutes of blocks)
    // Free tier: 5 calls/sec, so we can check ~150 blocks with delays
    // NOTE: We scan blocks backwards (newest first) to find recent large transactions
    const blocksToScan = 150; // Increased from 100 to find more transactions
    const uniqueTxHashes = new Set<string>(); // Avoid duplicates
    
    console.log(`[Etherscan] Starting to scan ${blocksToScan} blocks (from ${latestBlock} backwards) for transactions >= $${minAmountUsd}`);
    
    for (let i = 0; i < blocksToScan; i++) {
      const blockNumber = latestBlock - i;
      
      // Rate limiting check
      if (!etherscanLimiter.canMakeCall('etherscan')) {
        console.log(`[Etherscan] Rate limit reached at block ${blockNumber}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 250)); // Wait 250ms
        if (!etherscanLimiter.canMakeCall('etherscan')) {
          console.log(`[Etherscan] Stopped scanning at block ${blockNumber}, found ${alerts.length} alerts so far`);
          break;
        }
      }

      // Add delay between calls (except first one)
      if (i > 0 && i % 4 === 0) { // Every 4 blocks, add a small delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      try {
        const blockHex = '0x' + blockNumber.toString(16);
        const blockResponse = await fetch(
          `https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_getBlockByNumber&tag=${blockHex}&boolean=true&apikey=${apiKey}`,
          { next: { revalidate: 60 } } // Cache blocks for 60s
        );

        if (!blockResponse.ok) {
          continue;
        }

        const blockData = await blockResponse.json();
        
        // V2 proxy endpoints return JSON-RPC format: {jsonrpc: "2.0", id: X, result: {...}}
        // NOT the standard Etherscan format: {status: "1", message: "OK", result: {...}}
        let blockResult: any;
        if (blockData.jsonrpc && blockData.result) {
          // JSON-RPC format (V2 proxy endpoint)
          blockResult = blockData.result;
        } else if (blockData.status === '1' && blockData.result) {
          // Standard Etherscan format (fallback)
          blockResult = blockData.result;
        } else {
          if (i % 20 === 0) {
            console.log(`[Etherscan] Block ${blockNumber} returned no transactions or error`);
          }
          continue;
        }
        
        if (!blockResult || !blockResult.transactions) {
          continue;
        }

        const transactions = blockResult.transactions;
        
        if (!Array.isArray(transactions) || transactions.length === 0) {
          continue;
        }
        
        // Log progress every 20 blocks
        if (i % 20 === 0) {
          console.log(`[Etherscan] Scanned ${i} blocks, found ${alerts.length} alerts so far, block ${blockNumber} has ${transactions.length} transactions`);
        }
        
        // Process transactions in this block
        for (const tx of transactions) {
          // CRITICAL: Validate tx.hash exists and is valid BEFORE using it
          if (!tx.hash || typeof tx.hash !== 'string' || !tx.hash.startsWith('0x') || tx.hash.length !== 66) {
            console.warn(`[Etherscan] Skipping transaction with invalid hash in block ${blockNumber}`);
            continue;
          }

          // Skip if already processed (duplicate check)
          if (uniqueTxHashes.has(tx.hash)) continue;
          uniqueTxHashes.add(tx.hash);

          // Only native ETH transfers (has value and 'to' address)
          if (!tx.value || tx.value === '0x0' || !tx.to) continue;

          const value = BigInt(tx.value);
          const valueEth = Number(value) / 1e18;
          const valueUsd = valueEth * ethPriceUsd;

          // With $0 threshold, accept all transactions (but filter dust < $0.10)
          const effectiveThreshold = Math.max(minAmountUsd, 0.1); // Minimum $0.10 to filter dust
          if (valueUsd >= effectiveThreshold) {
            // Get block timestamp (if available) or use current time
            const blockTimestamp = blockResult.timestamp 
              ? (typeof blockResult.timestamp === 'string' && blockResult.timestamp.startsWith('0x')
                  ? parseInt(blockResult.timestamp, 16) * 1000
                  : parseInt(blockResult.timestamp) * 1000)
              : Date.now();

            const fromLabel = getLabelForAddress('ethereum', tx.from);
            const toLabel = getLabelForAddress('ethereum', tx.to);

            alerts.push({
              id: `ethereum-${tx.hash}`, // Stable ID: only hash, no timestamp
              blockchain: 'ethereum',
              txHash: tx.hash, // REAL txHash from blockchain!
              timestamp: blockTimestamp,
              blockNumber: blockNumber,
              fee: tx.gas && tx.gasPrice 
                ? (Number(BigInt(tx.gas) * BigInt(tx.gasPrice)) / 1e18).toFixed(6)
                : '0',
              feeUsd: tx.gas && tx.gasPrice 
                ? (Number(BigInt(tx.gas) * BigInt(tx.gasPrice)) / 1e18) * ethPriceUsd
                : 0,
              cryptoPriceAtTx: ethPriceUsd,
              token: {
                symbol: 'ETH',
                name: 'Ethereum',
                decimals: 18,
                amount: valueEth.toFixed(6),
                amountUsd: valueUsd,
              },
              from: {
                address: tx.from,
                label: fromLabel || 'Unknown Wallet',
                amount: valueEth.toFixed(6),
                amountUsd: valueUsd,
              },
              to: [{
                address: tx.to,
                label: toLabel || 'Unknown Wallet',
                amount: valueEth.toFixed(6),
                amountUsd: valueUsd,
              }],
              alertType: detectAlertType(fromLabel, toLabel, valueUsd),
              severity: determineSeverity(valueUsd),
              timeAgo: formatTimeAgo(blockTimestamp),
              isNew: (Date.now() - blockTimestamp) < 60000,
            });

            // Stop after finding enough alerts (we can return early)
            if (alerts.length >= 50) break; // Get more alerts since we're scanning blocks
          }
        }

        if (alerts.length >= 50) break; // Stop scanning if we have enough
      } catch (error) {
        console.error(`[Etherscan] Error fetching block ${blockNumber}:`, error);
        continue;
      }
    }

    console.log(`[Etherscan] Block scanning found ${alerts.length} alerts`);

    // APPROACH 2: Fallback - always check known whale addresses for more data
    // These addresses have guaranteed activity
    const knownWhaleAddresses = [
      '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', // Binance Hot Wallet (most active)
      '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance 2
      '0xd551234Ae421e3BCBA99A0Da6d736074f22192FF', // Binance 3
      '0xde0b295669a9fd93d5f28d9ec85e19f4cd77182a', // Coinbase
    ];

    // Check whale addresses for additional transactions (complements block scanning)
    for (const address of knownWhaleAddresses) {
      if (alerts.length >= 50 || !etherscanLimiter.canMakeCall('etherscan')) break;
      
      // Add delay to respect rate limits
      if (knownWhaleAddresses.indexOf(address) > 0) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      try {
        const txResponse = await fetch(
          `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=20&apikey=${apiKey}`,
          { next: { revalidate: 30 } }
        );

        if (!txResponse.ok) {
          console.warn(`[Etherscan] Failed to fetch from whale address ${address.substring(0,10)}...: ${txResponse.status}`);
          continue;
        }
        
        const txData = await txResponse.json();
        
        // Debug: Log full response for troubleshooting
        console.log(`[Etherscan] Whale address ${address.substring(0,10)}... response:`, {
          status: txData.status,
          message: txData.message,
          resultType: typeof txData.result,
          resultLength: Array.isArray(txData.result) ? txData.result.length : 'not array'
        });
        
        // Etherscan sometimes returns status "0" but still has data
        // Check if result is an array with data, even if status is not "1"
        if (!Array.isArray(txData.result) || txData.result.length === 0) {
          if (txData.status !== '1' && txData.message) {
            console.warn(`[Etherscan] Whale address ${address.substring(0,10)}... API error: ${txData.message}`);
          }
          continue;
        }

        console.log(`[Etherscan] ✅ Whale address ${address.substring(0,10)}... returned ${txData.result.length} transactions`);

        for (const tx of txData.result.slice(0, 20)) {
          // CRITICAL: Validate tx.hash exists and is valid BEFORE using it
          if (!tx.hash || typeof tx.hash !== 'string' || !tx.hash.startsWith('0x') || tx.hash.length !== 66) {
            console.warn(`[Etherscan] Skipping transaction with invalid hash from whale address ${address.substring(0,10)}...`);
            continue;
          }

          // Skip duplicates
          if (uniqueTxHashes.has(tx.hash)) continue;
          uniqueTxHashes.add(tx.hash);

          // Skip if too old (last 7 days only)
          const txTime = parseInt(tx.timeStamp) * 1000;
          if (Date.now() - txTime > 7 * 24 * 60 * 60 * 1000) continue;
          
          // Skip contract calls (only native ETH transfers)
          if (!tx.to || tx.to === '' || tx.value === '0' || !tx.value) continue;

          const value = BigInt(tx.value || '0');
          if (value === 0n) continue;

          const valueEth = Number(value) / 1e18;
          const valueUsd = valueEth * ethPriceUsd;

          // With $0 threshold, we accept ALL transactions, but filter very small ones (dust)
          if (valueUsd >= 0.1) { // At least $0.10 to filter dust
            const fromLabel = getLabelForAddress('ethereum', tx.from);
            const toLabel = getLabelForAddress('ethereum', tx.to);

            alerts.push({
              id: `ethereum-${tx.hash}`, // Stable ID: only hash, no timestamp
              blockchain: 'ethereum',
              txHash: tx.hash, // REAL txHash from Etherscan API!
              timestamp: txTime,
              blockNumber: parseInt(tx.blockNumber),
              fee: (parseInt(tx.gasUsed || '0') * parseInt(tx.gasPrice || '0') / 1e18).toFixed(6),
              feeUsd: (parseInt(tx.gasUsed || '0') * parseInt(tx.gasPrice || '0') / 1e18) * ethPriceUsd,
              cryptoPriceAtTx: ethPriceUsd,
              token: {
                symbol: 'ETH',
                name: 'Ethereum',
                decimals: 18,
                amount: valueEth.toFixed(6),
                amountUsd: valueUsd,
              },
              from: {
                address: tx.from,
                label: fromLabel || 'Unknown Wallet',
                amount: valueEth.toFixed(6),
                amountUsd: valueUsd,
              },
              to: [{
                address: tx.to,
                label: toLabel || 'Unknown Wallet',
                amount: valueEth.toFixed(6),
                amountUsd: valueUsd,
              }],
              alertType: detectAlertType(fromLabel, toLabel, valueUsd),
              severity: determineSeverity(valueUsd),
              timeAgo: formatTimeAgo(txTime),
              isNew: (Date.now() - txTime) < 60000,
            });

            if (alerts.length >= 50) break;
          }
        }
      } catch (error) {
        console.error(`[Etherscan] Error fetching from whale address ${address}:`, error);
        continue;
      }

      if (alerts.length >= 50) break;
    }

    // Return ONLY real alerts - NO simulated data!
    const sortedAlerts = alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
    console.log(`[Etherscan] ✅ Total alerts after both approaches: ${sortedAlerts.length} (block scanning + whale addresses)`);
    
    // Validate all txHash are real and valid format
    const invalidHashes = sortedAlerts.filter(a => !a.txHash || !a.txHash.startsWith('0x') || a.txHash.length !== 66);
    if (invalidHashes.length > 0) {
      console.error(`[Etherscan] ❌ WARNING: ${invalidHashes.length} alerts with invalid txHash format!`);
      console.error(`[Etherscan] Invalid alerts:`, invalidHashes.map(a => ({ id: a.id, txHash: a.txHash })));
    }
    
    // Log sample alert for debugging
    if (sortedAlerts.length > 0) {
      const sample = sortedAlerts[0];
      console.log(`[Etherscan] ✅ Sample alert: ${sample.txHash}, $${sample.token.amountUsd.toFixed(2)}, block ${sample.blockNumber}`);
    } else {
      console.warn(`[Etherscan] ⚠️ NO ALERTS FOUND! Check API key and rate limits.`);
    }
    
    return sortedAlerts;
  } catch (error) {
    console.error('[Etherscan] Failed to fetch Ethereum transactions:', error);
    // Return empty array if API fails - NO simulated data!
    return [];
  }
}

/**
 * Fetch large Bitcoin transactions from Blockstream API (FREE, open source)
 * Uses REAL blockchain data from Blockstream API
 */
export async function fetchLargeBitcoinTransactions(
  minAmountUsd: number = ALERT_THRESHOLDS.medium
): Promise<CryptoFlashAlert[]> {
  if (!blockstreamLimiter.canMakeCall('blockstream')) {
    console.log('Rate limited: Blockstream');
    return [];
  }

  try {
    // Fetch recent blocks from Blockstream API (last 10 blocks = ~100 minutes)
    const alerts: CryptoFlashAlert[] = [];
    
    // Fetch real-time BTC price from CoinGecko
    let btcPriceUsd = 65000; // Fallback price
    try {
      const priceResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        { next: { revalidate: 60 } }
      );
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        btcPriceUsd = priceData.bitcoin?.usd || 65000;
      }
    } catch (e) {
      // Use fallback price if CoinGecko fails
    }
    
    // Known Bitcoin whale/exchange addresses to monitor
    const knownAddresses = [
      '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo', // Binance
      '3D2oetdNuZUqQHPJmcMDDHYoqkyNVsFk9r', // Bitfinex
      'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97', // Known whale
    ];

    // For each known address, get recent transactions
    for (const address of knownAddresses.slice(0, 2)) { // Limit for free tier
      if (!blockstreamLimiter.canMakeCall('blockstream')) break;
      
      try {
        // Blockstream API: Get address transactions
        const response = await fetch(
          `https://blockstream.info/api/address/${address}/txs`,
          {
            next: { revalidate: 60 }, // Cache for 60 seconds
          }
        );

        if (!response.ok) continue;
        
        const transactions = await response.json();
        if (!Array.isArray(transactions)) continue;

        console.log(`[Blockstream] Found ${transactions.length} transactions for ${address}`);
        
        // Process transactions (last 10 for more data)
        for (const tx of transactions.slice(0, 10)) {
          // Get transaction details
          const txDetailResponse = await fetch(
            `https://blockstream.info/api/tx/${tx.txid}`,
            { next: { revalidate: 60 } }
          );

          if (!txDetailResponse.ok) continue;
          
          const txDetail = await txDetailResponse.json();
          
          // Skip if transaction is not confirmed or too old (increased to 48 hours)
          if (!txDetail.status?.block_time || !txDetail.status?.block_height) continue;
          const txTime = txDetail.status.block_time * 1000;
          if (Date.now() - txTime > 48 * 60 * 60 * 1000) continue;
          
          // Calculate largest output value sent to OTHER addresses (exclude change back to sender)
          let maxOutput = 0;
          let toAddress = '';
          
          for (const output of txDetail.vout || []) {
            if (!output.scriptpubkey_address) continue;
            const outputValue = output.value / 100000000; // Convert satoshi to BTC
            // Check if this output is NOT to the monitored address (i.e., it's a real transfer out)
            if (outputValue > maxOutput && output.scriptpubkey_address !== address) {
              maxOutput = outputValue;
              toAddress = output.scriptpubkey_address;
            }
          }
          
          // Skip if no valid external output found
          if (maxOutput === 0 || !toAddress) continue;
          
          const valueUsd = maxOutput * btcPriceUsd;

          if (valueUsd >= minAmountUsd) {
            // Get sender address from inputs
            let fromAddress = address; // Default to monitored address
            for (const input of txDetail.vin || []) {
              if (input.prevout?.scriptpubkey_address && 
                  input.prevout.scriptpubkey_address !== address) {
                fromAddress = input.prevout.scriptpubkey_address;
                break;
              }
            }
            
            // If all inputs are from monitored address, use it as sender
            if (fromAddress === address) {
              // This is a withdrawal FROM the monitored address
              fromAddress = address;
            }
            
            const fromLabel = getLabelForAddress('bitcoin', fromAddress);
            const toLabel = getLabelForAddress('bitcoin', toAddress);

            alerts.push({
              id: `bitcoin-${tx.txid}-${txDetail.status.block_time}`,
              blockchain: 'bitcoin',
              txHash: tx.txid, // REAL Bitcoin txHash!
              timestamp: txDetail.status.block_time * 1000,
              blockNumber: txDetail.status.block_height,
              fee: (txDetail.fee / 100000000).toFixed(8), // Convert to BTC
              feeUsd: (txDetail.fee / 100000000) * btcPriceUsd,
              cryptoPriceAtTx: btcPriceUsd,
              token: {
                symbol: 'BTC',
                name: 'Bitcoin',
                decimals: 8,
                amount: maxOutput.toFixed(8),
                amountUsd: valueUsd,
              },
              from: {
                address: fromAddress,
                label: fromLabel || 'Unknown Wallet',
                amount: maxOutput.toFixed(8),
                amountUsd: valueUsd,
              },
              to: [{
                address: toAddress,
                label: toLabel || 'Unknown Wallet',
                amount: maxOutput.toFixed(8),
                amountUsd: valueUsd,
              }],
              alertType: detectAlertType(fromLabel, toLabel, valueUsd),
              severity: determineSeverity(valueUsd),
              timeAgo: formatTimeAgo(txDetail.status.block_time * 1000),
              isNew: (Date.now() - txDetail.status.block_time * 1000) < 60000,
            });

            if (alerts.length >= 10) break;
          }
        }
      } catch (error) {
        console.error(`Error fetching Bitcoin transactions for ${address}:`, error);
        continue;
      }

      if (alerts.length >= 10) break;
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  } catch (error) {
    console.error('Failed to fetch Bitcoin transactions:', error);
    // Return empty array if API fails - NO simulated data!
    return [];
  }
}

/**
 * Detect alert type from transaction data
 */
function detectAlertType(
  fromLabel: KnownLabel | undefined,
  toLabel: KnownLabel | undefined,
  amountUsd: number
): AlertType {
  const isExchangeFrom = fromLabel && fromLabel !== 'Unknown Wallet';
  const isExchangeTo = toLabel && toLabel !== 'Unknown Wallet';
  
  if (isExchangeFrom && !isExchangeTo) {
    return 'exchange_withdrawal';
  }
  
  if (!isExchangeFrom && isExchangeTo) {
    return 'exchange_deposit';
  }
  
  if (isExchangeFrom && isExchangeTo) {
    return 'exchange_transfer';
  }
  
  if (amountUsd > ALERT_THRESHOLDS.critical) {
    return 'whale_buy';
  }
  
  return 'large_transfer';
}

/**
 * Determine severity based on amount
 */
function determineSeverity(amountUsd: number): CryptoFlashAlert['severity'] {
  if (amountUsd >= ALERT_THRESHOLDS.critical) return 'critical';
  if (amountUsd >= ALERT_THRESHOLDS.high) return 'high';
  if (amountUsd >= ALERT_THRESHOLDS.medium) return 'medium';
  return 'low';
}

/**
 * Get label for address
 */
function getLabelForAddress(
  blockchain: Blockchain,
  address: string
): KnownLabel | undefined {
  const exchanges = KNOWN_EXCHANGES[blockchain];
  return exchanges[address.toLowerCase()] || exchanges[address];
}

/**
 * Format time ago string
 */
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// DEPRECATED: All simulated alert functions removed
// All alerts now come from REAL blockchain APIs only (Etherscan, Blockstream)

/**
 * Get all alerts from all blockchains
 */
export async function getAllAlerts(
  minAmountUsd: number = ALERT_THRESHOLDS.low
): Promise<CryptoFlashAlert[]> {
  try {
    const [ethereumAlerts, bitcoinAlerts] = await Promise.all([
      fetchLargeEthereumTransactions(minAmountUsd),
      fetchLargeBitcoinTransactions(minAmountUsd),
    ]);

    return [...ethereumAlerts, ...bitcoinAlerts].sort(
      (a, b) => b.timestamp - a.timestamp
    );
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return [];
  }
}

/**
 * Filter alerts based on criteria
 */
export function filterAlerts(
  alerts: CryptoFlashAlert[],
  filters: {
    blockchains?: Blockchain[];
    alertTypes?: AlertType[];
    severities?: CryptoFlashAlert['severity'][];
    minAmountUsd?: number;
    maxAmountUsd?: number;
    tokens?: string[];
  }
): CryptoFlashAlert[] {
  return alerts.filter((alert) => {
    if (filters.blockchains && !filters.blockchains.includes(alert.blockchain)) {
      return false;
    }
    
    if (filters.alertTypes && !filters.alertTypes.includes(alert.alertType)) {
      return false;
    }
    
    if (filters.severities && !filters.severities.includes(alert.severity)) {
      return false;
    }
    
    if (filters.minAmountUsd && alert.token.amountUsd < filters.minAmountUsd) {
      return false;
    }
    
    if (filters.maxAmountUsd && alert.token.amountUsd > filters.maxAmountUsd) {
      return false;
    }
    
    if (filters.tokens && !filters.tokens.includes(alert.token.symbol)) {
      return false;
    }
    
    return true;
  });
}

