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
 * NEW APPROACH: Scans recent blocks instead of specific addresses
 * Gets latest blocks and filters for large transactions
 */
export async function fetchLargeEthereumTransactions(
  minAmountUsd: number = ALERT_THRESHOLDS.medium
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
      `https://api.etherscan.com/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`,
      { next: { revalidate: 15 } }
    );

    if (!blockNumberResponse.ok) {
      console.error('[Etherscan] Failed to get latest block number:', blockNumberResponse.status);
      return [];
    }

    const blockNumberData = await blockNumberResponse.json();
    if (blockNumberData.status !== '1' || !blockNumberData.result) {
      console.error('[Etherscan] Block number API error:', blockNumberData.message || 'Unknown');
      return [];
    }

    const latestBlockHex = blockNumberData.result;
    const latestBlock = parseInt(latestBlockHex, 16);
    console.log(`[Etherscan] Latest block: ${latestBlock}`);

    // Step 2: Scan last 100 blocks for large transactions (about 20 minutes of blocks)
    // Free tier: 5 calls/sec, so we can check ~100 blocks with delays
    const blocksToScan = 100;
    const uniqueTxHashes = new Set<string>(); // Avoid duplicates
    
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
          `https://api.etherscan.com/api?module=proxy&action=eth_getBlockByNumber&tag=${blockHex}&boolean=true&apikey=${apiKey}`,
          { next: { revalidate: 60 } } // Cache blocks for 60s
        );

        if (!blockResponse.ok) {
          continue;
        }

        const blockData = await blockResponse.json();
        if (blockData.status !== '1' || !blockData.result || !blockData.result.transactions) {
          continue;
        }

        const transactions = blockData.result.transactions;
        
        // Process transactions in this block
        for (const tx of transactions) {
          // Skip if already processed (duplicate check)
          if (uniqueTxHashes.has(tx.hash)) continue;
          uniqueTxHashes.add(tx.hash);

          // Only native ETH transfers (has value and 'to' address)
          if (!tx.value || tx.value === '0x0' || !tx.to) continue;

          const value = BigInt(tx.value);
          const valueEth = Number(value) / 1e18;
          const valueUsd = valueEth * ethPriceUsd;

          // Check if meets threshold
          if (valueUsd >= minAmountUsd) {
            // Get block timestamp (if available) or use current time
            const blockTimestamp = blockData.result.timestamp 
              ? parseInt(blockData.result.timestamp, 16) * 1000 
              : Date.now();

            const fromLabel = getLabelForAddress('ethereum', tx.from);
            const toLabel = getLabelForAddress('ethereum', tx.to);

            alerts.push({
              id: `ethereum-${tx.hash}-${blockTimestamp}`,
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

    // Return ONLY real alerts - NO simulated data!
    const sortedAlerts = alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
    console.log(`[Etherscan] Returning ${sortedAlerts.length} total alerts from block scanning`);
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

