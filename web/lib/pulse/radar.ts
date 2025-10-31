// Money Flow Radar - Large transaction tracking
export type MoneyFlow = {
  id: string;
  txHash: string;
  token: {
    address: string;
    symbol: string;
    name: string;
  };
  amount: number;
  amountUsd: number;
  fromAddress: string;
  toAddress: string;
  type: 'buy' | 'sell' | 'transfer';
  chain: string;
  timestamp: number;
  radarIntensity: number; // 1-100 for visualization
  category: 'whale' | 'shark' | 'dolphin'; // >$1M, >$100k, >$10k
  explorerUrl: string;
};

export type RadarPosition = {
  token: string;
  x: number; // 0-100
  y: number; // 0-100
  pulse: number; // Current activity level
  flow: MoneyFlow[];
};

// Simulate radar positions for visualization
export function calculateRadarPositions(flows: MoneyFlow[]): RadarPosition[] {
  const grouped = flows.reduce((acc, flow) => {
    if (!acc[flow.token.symbol]) {
      acc[flow.token.symbol] = {
        token: flow.token.symbol,
        x: Math.random() * 80 + 10, // 10-90
        y: Math.random() * 80 + 10,
        pulse: 0,
        flow: [],
      };
    }
    acc[flow.token.symbol].flow.push(flow);
    acc[flow.token.symbol].pulse = Math.max(
      acc[flow.token.symbol].pulse,
      flow.radarIntensity
    );
    return acc;
  }, {} as Record<string, RadarPosition>);

  return Object.values(grouped);
}

export async function getMoneyFlows(
  chain: 'ethereum' | 'bsc' | 'arbitrum' | 'polygon' = 'ethereum',
  minUsd: number = 10000
): Promise<MoneyFlow[]> {
  try {
    // For MVP: Simulate with known patterns
    // In production: Use Etherscan, Alchemy, Moralis WebSocket APIs
    
    const flows: MoneyFlow[] = [];
    const tokens = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'BNB', 'MATIC', 'AVAX'];
    
    // Generate simulated flows
    for (let i = 0; i < 20; i++) {
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const amountUsd = minUsd * (1 + Math.random() * 10); // $10k-$100k+
      const type = Math.random() > 0.5 ? 'buy' : 'sell';
      
      let category: 'whale' | 'shark' | 'dolphin';
      if (amountUsd > 1000000) category = 'whale';
      else if (amountUsd > 100000) category = 'shark';
      else category = 'dolphin';

      flows.push({
        id: `flow-${Date.now()}-${i}`,
        txHash: '0x' + Math.random().toString(16).slice(2, 66),
        token: {
          address: `0x${Math.random().toString(16).slice(2, 42)}`,
          symbol: token,
          name: `${token} Token`,
        },
        amount: amountUsd / 100, // Simplified
        amountUsd,
        fromAddress: '0x' + Math.random().toString(16).slice(2, 42),
        toAddress: '0x' + Math.random().toString(16).slice(2, 42),
        type,
        chain,
        timestamp: Date.now() - Math.random() * 3600000,
        radarIntensity: Math.min(Math.floor(amountUsd / 10000), 100),
        category,
        explorerUrl: `https://${chain === 'ethereum' ? 'etherscan.io' : chain === 'bsc' ? 'bscscan.com' : 'arbiscan.io'}/tx/0x`,
      });
    }

    return flows.sort((a, b) => b.amountUsd - a.amountUsd);
  } catch (error) {
    console.error('Failed to fetch money flows:', error);
    return [];
  }
}
