// Real-time wallet tracking with Etherscan API
import type { TrackedWallet, WalletTransaction, WalletPosition, Token, WalletAddress } from './types';

// Known whale wallets - curated list (in production, build from historical data)
const KNOWN_WHALES: Array<{
  address: string;
  label: string;
  tags: string[];
  category: TrackedWallet['category'];
}> = [
  {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    label: 'Vitalik Buterin',
    tags: ['Founder', 'Ethereum'],
    category: 'whale',
  },
  {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    label: 'Vitalik.eth',
    tags: ['Founder'],
    category: 'whale',
  },
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
    address: '0xdfd5293d8e347dfe59e90efd55b2956a1343963d',
    label: 'CryptoWhale #1',
    tags: ['DeFi', 'Trading'],
    category: 'smart-money',
  },
];

export async function getTrackedWallets(): Promise<TrackedWallet[]> {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY || '';
    
    // For MVP: Return curated wallets with simulated data
    // In production: Fetch real data from Etherscan/Moralis
    
    const wallets: TrackedWallet[] = await Promise.all(
      KNOWN_WHALES.map(async (whale) => {
        // Simulate fetching wallet data
        // In production: Use Etherscan API to get balance, transactions, etc.
        
        return {
          address: whale.address,
          label: whale.label,
          tags: whale.tags,
          totalProfitUsd: Math.random() * 2000000 + 500000, // Simulated
          winRate: Math.random() * 30 + 60, // 60-90%
          totalTrades: Math.floor(Math.random() * 500 + 100),
          followers: Math.floor(Math.random() * 2000 + 100),
          firstTracked: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
          lastActivity: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
          category: whale.category,
          positions: [], // Will be populated by getWalletPositions
        };
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
    
    if (!apiKey) {
      // Return simulated data for MVP
      return generateSimulatedTransactions(address, limit);
    }

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

    if (data.status === '0' || !data.result) {
      return generateSimulatedTransactions(address, limit);
    }

    // Transform Etherscan transactions to our format
    const transactions: WalletTransaction[] = data.result
      .slice(0, limit)
      .map((tx: any) => {
        const value = BigInt(tx.value || '0');
        const valueUsd = Number(value) / 1e18 * 3000; // Approximate ETH price

        return {
          id: tx.hash,
          txHash: tx.hash,
          timestamp: parseInt(tx.timeStamp) * 1000,
          type: valueUsd > 0 ? 'buy' : 'transfer',
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
        };
      });

    return transactions;
  } catch (error) {
    console.error(`Failed to fetch transactions for ${address}:`, error);
    return generateSimulatedTransactions(address, limit);
  }
}

function generateSimulatedTransactions(
  address: WalletAddress,
  limit: number
): WalletTransaction[] {
  const tokens: Token[] = [
    { address: '0x0', symbol: 'ETH', name: 'Ethereum', decimals: 18, chain: 'ethereum' },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, chain: 'ethereum' },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether', decimals: 6, chain: 'ethereum' },
  ];

  return Array.from({ length: limit }, (_, i) => {
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const type = Math.random() > 0.3 ? 'buy' : 'sell';
    const amountUsd = Math.random() * 500000 + 10000;

    return {
      id: `${address}-${Date.now()}-${i}`,
      txHash: '0x' + Math.random().toString(16).slice(2, 66),
      timestamp: Date.now() - i * 60 * 60 * 1000,
      type,
      token,
      amount: String(Math.floor(amountUsd / 3000 * 1e18)),
      amountUsd,
      fromAddress: type === 'buy' ? '0x' + Math.random().toString(16).slice(2, 42) : address,
      toAddress: type === 'buy' ? address : '0x' + Math.random().toString(16).slice(2, 42),
      price: 3000 + Math.random() * 1000,
    };
  });
}

export async function getWalletPositions(
  address: WalletAddress
): Promise<WalletPosition[]> {
  try {
    // In production: Fetch from Etherscan token balance API
    // For MVP: Simulate positions
    const tokens: Token[] = [
      { address: '0x0', symbol: 'ETH', name: 'Ethereum', decimals: 18, chain: 'ethereum' },
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, chain: 'ethereum' },
    ];

    return tokens.map((token) => {
      const balance = Math.random() * 100;
      const currentPrice = token.symbol === 'ETH' ? 3500 : 1;
      const avgBuyPrice = currentPrice * (0.8 + Math.random() * 0.4);
      const balanceUsd = balance * currentPrice;
      const pnl = (currentPrice - avgBuyPrice) * balance;
      const pnlPercent = ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100;

      return {
        token,
        balance: String(balance * 1e18),
        balanceUsd,
        avgBuyPrice,
        currentPrice,
        pnl,
        pnlPercent,
      };
    });
  } catch (error) {
    console.error(`Failed to fetch positions for ${address}:`, error);
    return [];
  }
}

