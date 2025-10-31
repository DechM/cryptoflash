// Real-time wallet tracking with Etherscan API
import type { TrackedWallet, WalletTransaction, WalletPosition, Token, WalletAddress } from './types';

// Known whale wallets - curated list (verified public addresses)
// Only real exchange wallets with actual transaction data
const KNOWN_WHALES: Array<{
  address: string;
  label: string;
  tags: string[];
  category: TrackedWallet['category'];
}> = [
  {
    address: '0x28C6c06298d514Db089934071355E5743bf21d60',
    label: 'Binance Hot Wallet',
    tags: ['Exchange', 'CEX'],
    category: 'whale',
  },
  {
    address: '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549',
    label: 'Binance 14',
    tags: ['Exchange'],
    category: 'whale',
  },
  {
    address: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
    label: 'Binance 2',
    tags: ['Exchange', 'CEX'],
    category: 'whale',
  },
  {
    address: '0x564286362092D8e7936f0549571a803B203aAceD',
    label: 'Binance 3',
    tags: ['Exchange', 'CEX'],
    category: 'whale',
  },
  {
    address: '0x0681d8Db095565FE8a346fA0277bFfdE9C0eDBBF',
    label: 'Binance 4',
    tags: ['Exchange', 'CEX'],
    category: 'whale',
  },
  {
    address: '0xFE65F9b3408aE3a1f7D277F90fB9E494250e340a',
    label: 'Binance 5',
    tags: ['Exchange', 'CEX'],
    category: 'whale',
  },
  {
    address: '0x503828976D22510aad0201ac7EC88293211D23Da',
    label: 'Coinbase Treasury',
    tags: ['Exchange', 'CEX'],
    category: 'whale',
  },
  {
    address: '0xd551234Ae421e3BCBA99A0Da6d736074f9d48D38',
    label: 'Binance 6',
    tags: ['Exchange', 'CEX'],
    category: 'whale',
  },
];

// Rate limiter for Etherscan API
class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private windowMs: number;

  constructor(maxCalls: number, windowMs: number) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  canMakeCall(): boolean {
    const now = Date.now();
    this.calls = this.calls.filter((time) => now - time < this.windowMs);
    
    if (this.calls.length >= this.maxCalls) {
      return false;
    }
    
    this.calls.push(now);
    return true;
  }

  async waitForSlot(): Promise<void> {
    while (!this.canMakeCall()) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
}

const rateLimiter = new RateLimiter(5, 1000); // 5 calls per second

// Fetch ETH balance
async function fetchETHBalance(address: string, apiKey: string): Promise<number> {
  await rateLimiter.waitForSlot();
  
  try {
    const response = await fetch(
      `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`,
      { next: { revalidate: 300 } }
    );
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json();
    
    if (data.status === '1' && data.result) {
      const balanceWei = BigInt(data.result);
      return Number(balanceWei) / 1e18;
    }
    
    return 0;
  } catch (error) {
    console.error(`Failed to fetch ETH balance for ${address}:`, error);
    return 0;
  }
}

// Fetch transaction list and calculate stats
async function fetchWalletStats(
  address: string,
  apiKey: string
): Promise<{
  totalTrades: number;
  lastActivity: number;
  firstTracked: number;
  totalProfitUsd: number;
  winRate: number;
}> {
  await rateLimiter.waitForSlot();
  
  try {
    // Fetch last 1000 transactions to calculate stats
    const response = await fetch(
      `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1000&sort=desc&apikey=${apiKey}`,
      { next: { revalidate: 300 } }
    );
    
    if (!response.ok) {
      return {
        totalTrades: 0,
        lastActivity: Date.now(),
        firstTracked: Date.now(),
        totalProfitUsd: 0,
        winRate: 0,
      };
    }
    
    const data = await response.json();
    
    if (data.status !== '1' || !Array.isArray(data.result) || data.result.length === 0) {
      return {
        totalTrades: 0,
        lastActivity: Date.now(),
        firstTracked: Date.now(),
        totalProfitUsd: 0,
        winRate: 0,
      };
    }
    
    const transactions = data.result;
    const totalTrades = transactions.length;
    
    // Get last activity (most recent transaction)
    const lastActivity = transactions.length > 0 
      ? parseInt(transactions[0].timeStamp) * 1000 
      : Date.now();
    
    // Get first tracked (oldest transaction)
    const firstTracked = transactions.length > 0 
      ? parseInt(transactions[transactions.length - 1].timeStamp) * 1000 
      : Date.now();
    
    // Fetch current ETH price
    let ethPrice = 3000;
    try {
      const priceResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { next: { revalidate: 60 } }
      );
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        ethPrice = priceData.ethereum?.usd || 3000;
      }
    } catch (e) {
      console.error('Failed to fetch ETH price:', e);
    }
    
    // Calculate P&L from transactions (simplified - based on in/out flows)
    // This is a simplified calculation - in production, you'd track token prices at transaction time
    let totalInflow = 0;
    let totalOutflow = 0;
    let profitableTrades = 0;
    
    for (const tx of transactions.slice(0, 500)) { // Limit to 500 for performance
      const value = BigInt(tx.value || '0');
      const valueEth = Number(value) / 1e18;
      const valueUsd = valueEth * ethPrice;
      
      // Determine if this is an inflow (to address) or outflow (from address)
      const isInflow = tx.to?.toLowerCase() === address.toLowerCase();
      
      if (isInflow && valueUsd > 100) { // Only count significant inflows
        totalInflow += valueUsd;
        profitableTrades++;
      } else if (!isInflow && tx.from?.toLowerCase() === address.toLowerCase() && valueUsd > 100) {
        totalOutflow += valueUsd;
      }
    }
    
    const totalProfitUsd = totalInflow - totalOutflow;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    
    return {
      totalTrades,
      lastActivity,
      firstTracked,
      totalProfitUsd: Math.max(0, totalProfitUsd), // Don't show negative for now
      winRate: Math.min(100, Math.max(0, winRate)),
    };
  } catch (error) {
    console.error(`Failed to fetch wallet stats for ${address}:`, error);
    return {
      totalTrades: 0,
      lastActivity: Date.now(),
      firstTracked: Date.now(),
      totalProfitUsd: 0,
      winRate: 0,
    };
  }
}

export async function getTrackedWallets(): Promise<TrackedWallet[]> {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY || '';
    
    if (!apiKey || apiKey === 'YourApiKeyToken') {
      console.warn('⚠️ ETHERSCAN_API_KEY не е зададен! Връщаме празен списък.');
      return [];
    }
    
    // Fetch real data for each wallet
    const wallets: TrackedWallet[] = await Promise.all(
      KNOWN_WHALES.map(async (whale, index) => {
        // Add delay between wallets to respect rate limits
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        try {
          const [stats] = await Promise.all([
            fetchWalletStats(whale.address, apiKey),
          ]);
          
          return {
            address: whale.address,
            label: whale.label,
            tags: whale.tags,
            totalProfitUsd: stats.totalProfitUsd,
            winRate: stats.winRate,
            totalTrades: stats.totalTrades,
            followers: Math.floor(stats.totalTrades / 10), // Estimated based on activity
            firstTracked: stats.firstTracked,
            lastActivity: stats.lastActivity,
            category: whale.category,
            positions: [], // Will be populated by getWalletPositions
          };
        } catch (error) {
          console.error(`Failed to fetch data for ${whale.label}:`, error);
          // Return wallet with zero stats if API fails
          return {
            address: whale.address,
            label: whale.label,
            tags: whale.tags,
            totalProfitUsd: 0,
            winRate: 0,
            totalTrades: 0,
            followers: 0,
            firstTracked: Date.now(),
            lastActivity: Date.now(),
            category: whale.category,
            positions: [],
          };
        }
      })
    );

    return wallets;
  } catch (error) {
    console.error('Failed to fetch tracked wallets:', error);
    return [];
  }
}

export async function getWalletTransactions(
  address: WalletAddress,
  limit: number = 50
): Promise<WalletTransaction[]> {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY || '';
    
    if (!apiKey || apiKey === 'YourApiKeyToken') {
      console.warn('⚠️ ETHERSCAN_API_KEY не е зададен!');
      return [];
    }

    await rateLimiter.waitForSlot();

    // Real Etherscan API call (V2)
    const response = await fetch(
      `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${apiKey}`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === '0' || !data.result || !Array.isArray(data.result)) {
      return [];
    }

    // Fetch current ETH price
    let ethPrice = 3000;
    try {
      const priceResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { next: { revalidate: 60 } }
      );
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        ethPrice = priceData.ethereum?.usd || 3000;
      }
    } catch (e) {
      console.error('Failed to fetch ETH price:', e);
    }

    // Transform Etherscan transactions to our format
    const transactions: WalletTransaction[] = data.result
      .slice(0, limit)
      .map((tx: any) => {
        const value = BigInt(tx.value || '0');
        const valueEth = Number(value) / 1e18;
        const valueUsd = valueEth * ethPrice;
        
        // Determine transaction type based on direction
        const isInflow = tx.to?.toLowerCase() === address.toLowerCase();
        const type: 'buy' | 'sell' | 'transfer' = isInflow ? 'buy' : 'transfer';

        return {
          id: tx.hash,
          txHash: tx.hash,
          timestamp: parseInt(tx.timeStamp) * 1000,
          type,
          token: {
            address: '0x0', // ETH
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            chain: 'ethereum',
          },
          amount: tx.value,
          amountUsd: valueUsd,
          fromAddress: tx.from,
          toAddress: tx.to,
          price: ethPrice,
        };
      });

    return transactions;
  } catch (error) {
    console.error(`Failed to fetch transactions for ${address}:`, error);
    return [];
  }
}

export async function getWalletPositions(
  address: WalletAddress
): Promise<WalletPosition[]> {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY || '';
    
    if (!apiKey || apiKey === 'YourApiKeyToken') {
      console.warn('⚠️ ETHERSCAN_API_KEY не е зададен!');
      return [];
    }

    await rateLimiter.waitForSlot();

    // Fetch ETH balance
    const ethBalance = await fetchETHBalance(address, apiKey);
    
    // Fetch token balances (tokenlist)
    await rateLimiter.waitForSlot();
    let tokenBalances: any[] = [];
    
    try {
      const tokenResponse = await fetch(
        `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenlist&address=${address}&apikey=${apiKey}`,
        { next: { revalidate: 300 } }
      );
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        if (tokenData.status === '1' && Array.isArray(tokenData.result)) {
          tokenBalances = tokenData.result.slice(0, 20); // Limit to top 20 tokens
        }
      }
    } catch (error) {
      console.error(`Failed to fetch token balances for ${address}:`, error);
    }

    // Fetch current prices for ETH and tokens
    const positions: WalletPosition[] = [];
    
    // Add ETH position
    if (ethBalance > 0) {
      let ethPrice = 3000;
      try {
        const priceResponse = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
          { next: { revalidate: 60 } }
        );
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          ethPrice = priceData.ethereum?.usd || 3000;
        }
      } catch (e) {
        console.error('Failed to fetch ETH price:', e);
      }
      
      positions.push({
        token: {
          address: '0x0',
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          chain: 'ethereum',
        },
        balance: String(BigInt(Math.floor(ethBalance * 1e18))),
        balanceUsd: ethBalance * ethPrice,
        avgBuyPrice: ethPrice * 0.9, // Simplified - would need transaction history for real avg
        currentPrice: ethPrice,
        pnl: ethBalance * ethPrice * 0.1, // Simplified P&L
        pnlPercent: 10,
      });
    }

    // Add token positions (simplified - would need historical prices for real P&L)
    for (const token of tokenBalances.slice(0, 10)) {
      const balance = parseFloat(token.balance || '0') / Math.pow(10, parseInt(token.decimals || '18'));
      if (balance > 0) {
        // For now, use simplified pricing (would need token price API)
        const tokenPrice = 1; // Placeholder - would fetch from CoinGecko
        const balanceUsd = balance * tokenPrice;
        
        if (balanceUsd > 10) { // Only show positions > $10
          positions.push({
            token: {
              address: token.contractAddress || '0x0',
              symbol: token.symbol || 'UNKNOWN',
              name: token.name || 'Unknown Token',
              decimals: parseInt(token.decimals || '18'),
              chain: 'ethereum',
            },
            balance: token.balance || '0',
            balanceUsd,
            avgBuyPrice: tokenPrice * 0.9,
            currentPrice: tokenPrice,
            pnl: balanceUsd * 0.1,
            pnlPercent: 10,
          });
        }
      }
    }

    return positions;
  } catch (error) {
    console.error(`Failed to fetch positions for ${address}:`, error);
    return [];
  }
}
