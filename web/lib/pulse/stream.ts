// Pulse Stream - Real-time DEX trade flow
export type PulseTrade = {
  id: string;
  txHash: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chain: string;
  dex: string;
  type: 'buy' | 'sell';
  amount: number;
  amountUsd: number;
  priceImpact: number;
  timestamp: number;
  trader: string;
  pulse: number; // 1-100 intensity score
  isUnusual: boolean;
};

export type PulseSummary = {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  buyPulse: number; // Aggregated pulse score
  sellPulse: number;
  netFlow: number; // USD
  tradeCount: number;
  unusualCount: number;
  lastActivity: number;
};

export async function getPulseStream(limit: number = 50): Promise<PulseTrade[]> {
  try {
    // Enhanced Dexscreener data with pulse scoring
    const response = await fetch(
      'https://api.dexscreener.com/latest/dex/search?q=USDT',
      {
        next: { revalidate: 30 }, // More frequent updates
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const pairs = 'pairs' in data && Array.isArray(data.pairs) ? data.pairs : [];

    // Transform to pulse trades with scoring
    const trades: PulseTrade[] = [];

    for (const pair of pairs.slice(0, limit)) {
      const volume = pair.volume?.h24 || 0;
      const liquidity = pair.liquidity?.usd || 1;
      
      // Calculate pulse intensity (1-100)
      const volumeRatio = Math.min(volume / liquidity, 10); // Cap at 10x
      const pulse = Math.min(Math.floor(volumeRatio * 10), 100);

      // Simulate trades from pair data
      // In production, use The Graph or DEX aggregator APIs for real trades
      const isBuy = (pair.priceChange?.h24 || 0) > 0;
      
      trades.push({
        id: `${pair.pairAddress}-${Date.now()}-${Math.random()}`,
        txHash: pair.pairAddress.slice(0, 10) + '...',
        tokenAddress: pair.baseToken.address,
        tokenSymbol: pair.baseToken.symbol,
        tokenName: pair.baseToken.name,
        chain: pair.chainId,
        dex: pair.dexId,
        type: isBuy ? 'buy' : 'sell',
        amount: volume * 0.1, // Estimated per-trade
        amountUsd: volume * 0.1,
        priceImpact: Math.abs(pair.priceChange?.h24 || 0),
        timestamp: Date.now() - Math.random() * 3600000, // Random within last hour
        trader: '0x' + Math.random().toString(16).slice(2, 10),
        pulse,
        isUnusual: pulse > 70 || volume > liquidity * 2,
      });
    }

    // Sort by pulse (most intense first)
    return trades.sort((a, b) => b.pulse - a.pulse);
  } catch (error) {
    console.error('Failed to fetch pulse stream:', error);
    return [];
  }
}

export async function getPulseSummary(tokenAddress?: string): Promise<PulseSummary[]> {
  const trades = await getPulseStream(200);
  
  // Group by token
  const grouped = trades.reduce((acc, trade) => {
    const key = trade.tokenAddress;
    if (!acc[key]) {
      acc[key] = {
        tokenAddress: trade.tokenAddress,
        tokenSymbol: trade.tokenSymbol,
        tokenName: trade.tokenName,
        buyPulse: 0,
        sellPulse: 0,
        netFlow: 0,
        tradeCount: 0,
        unusualCount: 0,
        lastActivity: 0,
      };
    }

    if (trade.type === 'buy') {
      acc[key].buyPulse += trade.pulse;
      acc[key].netFlow += trade.amountUsd;
    } else {
      acc[key].sellPulse += trade.pulse;
      acc[key].netFlow -= trade.amountUsd;
    }

    acc[key].tradeCount++;
    if (trade.isUnusual) acc[key].unusualCount++;
    acc[key].lastActivity = Math.max(acc[key].lastActivity, trade.timestamp);

    return acc;
  }, {} as Record<string, PulseSummary>);

  // Normalize pulse scores
  Object.values(grouped).forEach((summary) => {
    summary.buyPulse = Math.min(Math.floor(summary.buyPulse / summary.tradeCount), 100);
    summary.sellPulse = Math.min(Math.floor(summary.sellPulse / summary.tradeCount), 100);
  });

  return Object.values(grouped).sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow));
}
