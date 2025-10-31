// Blockchain transaction monitoring with FREE APIs only
import type { CryptoFlashAlert, Blockchain, AlertType, KnownLabel } from './types';
import { KNOWN_EXCHANGES, ALERT_THRESHOLDS } from './types';
import { getTokenEmoji } from './token-emoji';

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
 */
export async function fetchLargeEthereumTransactions(
  minAmountUsd: number = ALERT_THRESHOLDS.medium
): Promise<CryptoFlashAlert[]> {
  if (!etherscanLimiter.canMakeCall('etherscan')) {
    console.log('Rate limited: Etherscan');
    return [];
  }

  try {
    const apiKey = process.env.ETHERSCAN_API_KEY || '';
    
    // Get recent blocks (last 100 blocks = ~20 minutes)
    // Then check for large transactions
    const response = await fetch(
      `https://api.etherscan.com/api?module=proxy&action=eth_blockNumber&apikey=${apiKey || 'YourApiKeyToken'}`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error('Etherscan API error');
    }

    const blockNumberData = await response.json();
    const latestBlock = parseInt(blockNumberData.result, 16);
    
    // For MVP: We'll simulate alerts based on known patterns
    // In production: Poll recent blocks and filter large transactions
    // This requires more complex logic with block scanning
    
    return generateSimulatedAlerts('ethereum', minAmountUsd);
  } catch (error) {
    console.error('Failed to fetch Ethereum transactions:', error);
    return [];
  }
}

/**
 * Fetch large Bitcoin transactions from Blockstream API (FREE, open source)
 */
export async function fetchLargeBitcoinTransactions(
  minAmountUsd: number = ALERT_THRESHOLDS.medium
): Promise<CryptoFlashAlert[]> {
  if (!blockstreamLimiter.canMakeCall('blockstream')) {
    console.log('Rate limited: Blockstream');
    return [];
  }

  try {
    // Blockstream API endpoint for recent transactions
    // For MVP: Simulate alerts
    // In production: Use mempool.space API or Blockstream API to monitor mempool
    return generateSimulatedAlerts('bitcoin', minAmountUsd);
  } catch (error) {
    console.error('Failed to fetch Bitcoin transactions:', error);
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

/**
 * Generate simulated alerts for MVP (to be replaced with real blockchain monitoring)
 */
function generateSimulatedAlerts(
  blockchain: Blockchain,
  minAmountUsd: number
): CryptoFlashAlert[] {
  const tokens = blockchain === 'bitcoin' 
    ? [{ symbol: 'BTC', name: 'Bitcoin', decimals: 8 }]
    : [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        { symbol: 'USDT', name: 'Tether', decimals: 6 },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { symbol: 'BNB', name: 'Binance Coin', decimals: 18 },
      ];
  
  // Add emojis using the token-emoji map
  const tokensWithEmojis = tokens.map(token => ({
    ...token,
    emoji: getTokenEmoji(token.symbol),
  }));

  const alerts: CryptoFlashAlert[] = [];
  const now = Date.now();
  
  // Generate 5-10 simulated alerts
  const count = Math.floor(Math.random() * 5) + 5;
  
  for (let i = 0; i < count; i++) {
    const token = tokensWithEmojis[Math.floor(Math.random() * tokensWithEmojis.length)];
    const amountUsd = Math.random() * 5000000 + minAmountUsd;
    const amount = (amountUsd / 3000).toFixed(token.decimals); // Approximate price
    
    // Random addresses
    const fromAddress = blockchain === 'bitcoin'
      ? 'bc1' + Math.random().toString(36).substring(2, 40)
      : '0x' + Math.random().toString(16).substring(2, 42);
      
    const toAddress = blockchain === 'bitcoin'
      ? 'bc1' + Math.random().toString(36).substring(2, 40)
      : '0x' + Math.random().toString(16).substring(2, 42);
    
    const fromLabel = Math.random() > 0.5 ? getLabelForAddress(blockchain, fromAddress) : undefined;
    const toLabel = Math.random() > 0.5 ? getLabelForAddress(blockchain, toAddress) : undefined;
    
    const alertType = detectAlertType(fromLabel, toLabel, amountUsd);
    const severity = determineSeverity(amountUsd);
    
    const timestamp = now - Math.random() * 3600000; // Last hour
    
    alerts.push({
      id: `${blockchain}-${i}-${timestamp}`,
      blockchain,
      txHash: blockchain === 'bitcoin'
        ? Math.random().toString(16).substring(2, 66)
        : '0x' + Math.random().toString(16).substring(2, 66),
      timestamp,
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      fee: blockchain === 'bitcoin' ? '0.000028' : '0.001',
      feeUsd: blockchain === 'bitcoin' ? 3 : 3.5,
      cryptoPriceAtTx: 3000 + Math.random() * 1000,
      token: {
        symbol: token.symbol,
        name: token.name,
        emoji: token.emoji,
        decimals: token.decimals,
        amount,
        amountUsd,
      },
      from: {
        address: fromAddress,
        label: fromLabel || 'Unknown Wallet',
        amount,
        amountUsd,
      },
      to: [
        {
          address: toAddress,
          label: toLabel || 'Unknown Wallet',
          amount,
          amountUsd,
        },
      ],
      alertType,
      severity,
      timeAgo: formatTimeAgo(timestamp),
      isNew: timestamp > now - 60000, // New if less than 1 minute ago
    });
  }
  
  return alerts.sort((a, b) => b.timestamp - a.timestamp);
}

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

