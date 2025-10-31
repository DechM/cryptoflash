// Multi-chain transaction monitoring (BSC, Polygon, Arbitrum)
// Uses Etherscan API v2 with different chainid parameters
import type { CryptoFlashAlert, KnownLabel } from './types';
import { ALERT_THRESHOLDS, KNOWN_EXCHANGES } from './types';

function getLabelForAddress(blockchain: string, address: string): KnownLabel | undefined {
  const exchanges = KNOWN_EXCHANGES[blockchain as keyof typeof KNOWN_EXCHANGES];
  if (!exchanges) return undefined;
  
  const lowerAddress = address.toLowerCase();
  return exchanges[lowerAddress] || undefined;
}

// Helper functions (duplicated from blockchain-monitor.ts to avoid circular deps)
function detectAlertType(
  fromLabel: KnownLabel | undefined,
  toLabel: KnownLabel | undefined,
  amountUsd: number
): 'large_transfer' | 'exchange_transfer' | 'whale_buy' | 'whale_sell' | 'token_burn' | 'exchange_withdrawal' | 'exchange_deposit' | 'unknown_wallet_activity' {
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

function determineSeverity(amountUsd: number): 'low' | 'medium' | 'high' | 'critical' {
  if (amountUsd >= ALERT_THRESHOLDS.critical) return 'critical';
  if (amountUsd >= ALERT_THRESHOLDS.high) return 'high';
  if (amountUsd >= ALERT_THRESHOLDS.medium) return 'medium';
  return 'low';
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Rate limiter (same as blockchain-monitor.ts)
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
    const recentCalls = calls.filter((time) => now - time < this.windowMs);
    
    if (recentCalls.length >= this.maxCalls) {
      return false;
    }
    
    recentCalls.push(now);
    this.calls.set(key, recentCalls);
    return true;
  }
}

const multichainLimiter = new RateLimiter(5, 1000); // 5 calls per second

// Chain configurations
const CHAIN_CONFIG = {
  bsc: { chainid: 56, name: 'BNB Smart Chain', symbol: 'BNB', explorer: 'bscscan.com' },
  polygon: { chainid: 137, name: 'Polygon', symbol: 'MATIC', explorer: 'polygonscan.com' },
  arbitrum: { chainid: 42161, name: 'Arbitrum', symbol: 'ETH', explorer: 'arbiscan.io' },
};

/**
 * Fetch large transactions from BSC, Polygon, or Arbitrum
 */
export async function fetchLargeEVMTransactions(
  blockchain: 'bsc' | 'polygon' | 'arbitrum',
  minAmountUsd: number = ALERT_THRESHOLDS.low
): Promise<CryptoFlashAlert[]> {
  if (!multichainLimiter.canMakeCall(blockchain)) {
    console.log(`Rate limited: ${blockchain}`);
    return [];
  }

  try {
    const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
    
    if (apiKey === 'YourApiKeyToken') {
      console.warn(`[${blockchain}] ⚠️ ETHERSCAN_API_KEY не е зададен!`);
      return [];
    }

    const config = CHAIN_CONFIG[blockchain];
    const alerts: CryptoFlashAlert[] = [];
    
    // Fetch token price
    let tokenPriceUsd = blockchain === 'arbitrum' ? 3000 : (blockchain === 'bsc' ? 600 : 0.5); // BNB ~$600, MATIC ~$0.5
    try {
      const priceId = blockchain === 'bsc' ? 'binancecoin' : blockchain === 'polygon' ? 'matic-network' : 'ethereum';
      const priceResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${priceId}&vs_currencies=usd`,
        { next: { revalidate: 60 } }
      );
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        tokenPriceUsd = priceData[priceId]?.usd || tokenPriceUsd;
        console.log(`[${blockchain}] Token price: $${tokenPriceUsd}`);
      }
    } catch (e) {
      console.error(`[${blockchain}] Failed to fetch price:`, e);
    }

    // Known whale addresses for each chain
    const knownAddresses: Record<string, string[]> = {
      bsc: [
        '0x8894e0a0c962cb723c1976a4421c95949be2d4e3', // Binance Hot Wallet
        '0xe2fc31f816a9b94326492132018c3aecc4a93ae1', // Binance 2
      ],
      polygon: [
        '0x1ed3c57e3b8e8b5c4f2b5c9d3a8e5f8b5c4f2b5c', // Placeholder
      ],
      arbitrum: [
        '0x489ee077994b6658eafa855c308275ead8097c4a', // GMX Exchange
      ],
    };

    // Fetch transactions from known whale addresses
    const addresses = knownAddresses[blockchain] || [];
    const uniqueTxHashes = new Set<string>();

    for (const address of addresses) {
      if (alerts.length >= 30 || !multichainLimiter.canMakeCall(blockchain)) break;
      
      if (addresses.indexOf(address) > 0) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      try {
        const txResponse = await fetch(
          `https://api.etherscan.io/v2/api?chainid=${config.chainid}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=20&apikey=${apiKey}`,
          { next: { revalidate: 30 } }
        );

        if (!txResponse.ok) continue;
        
        const txData = await txResponse.json();
        
        if (!Array.isArray(txData.result) || txData.result.length === 0) {
          if (txData.status !== '1' && txData.message) {
            console.warn(`[${blockchain}] API error: ${txData.message}`);
          }
          continue;
        }

        console.log(`[${blockchain}] ✅ Address ${address.substring(0,10)}... returned ${txData.result.length} transactions`);

        for (const tx of txData.result.slice(0, 20)) {
          if (!tx.hash || typeof tx.hash !== 'string' || !tx.hash.startsWith('0x') || tx.hash.length !== 66) {
            continue;
          }

          if (uniqueTxHashes.has(tx.hash)) continue;
          uniqueTxHashes.add(tx.hash);

          const txTime = parseInt(tx.timeStamp) * 1000;
          if (Date.now() - txTime > 7 * 24 * 60 * 60 * 1000) continue;
          if (!tx.to || tx.to === '' || tx.value === '0' || !tx.value) continue;

          const value = BigInt(tx.value || '0');
          if (value === 0n) continue;

          const valueToken = Number(value) / 1e18;
          const valueUsd = valueToken * tokenPriceUsd;

          // Only whale transactions - minimum $100k
          const whaleThreshold = Math.max(minAmountUsd, ALERT_THRESHOLDS.low);
          if (valueUsd >= whaleThreshold) {
            const fromLabel = getLabelForAddress(blockchain, tx.from);
            const toLabel = getLabelForAddress(blockchain, tx.to);

            alerts.push({
              id: `${blockchain}-${tx.hash}`,
              blockchain: blockchain,
              txHash: tx.hash,
              timestamp: txTime,
              blockNumber: parseInt(tx.blockNumber),
              fee: (parseInt(tx.gasUsed || '0') * parseInt(tx.gasPrice || '0') / 1e18).toFixed(6),
              feeUsd: (parseInt(tx.gasUsed || '0') * parseInt(tx.gasPrice || '0') / 1e18) * tokenPriceUsd,
              cryptoPriceAtTx: tokenPriceUsd,
              token: {
                symbol: config.symbol,
                name: config.name,
                decimals: 18,
                amount: valueToken.toFixed(6),
                amountUsd: valueUsd,
              },
              from: {
                address: tx.from,
                label: fromLabel || 'Unknown Wallet',
                amount: valueToken.toFixed(6),
                amountUsd: valueUsd,
              },
              to: [{
                address: tx.to,
                label: toLabel || 'Unknown Wallet',
                amount: valueToken.toFixed(6),
                amountUsd: valueUsd,
              }],
              alertType: detectAlertType(fromLabel, toLabel, valueUsd),
              severity: determineSeverity(valueUsd),
              timeAgo: formatTimeAgo(txTime),
              isNew: (Date.now() - txTime) < 60000,
            });

            if (alerts.length >= 30) break;
          }
        }
      } catch (error) {
        console.error(`[${blockchain}] Error fetching from address ${address}:`, error);
        continue;
      }

      if (alerts.length >= 30) break;
    }

    const sortedAlerts = alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);
    console.log(`[${blockchain}] ✅ Total alerts: ${sortedAlerts.length}`);
    
    return sortedAlerts;
  } catch (error) {
    console.error(`[${blockchain}] Failed:`, error);
    return [];
  }
}

