// Signal Hunter - Enhanced token screener
export type HunterFilter = {
  chains?: string[];
  minVolume?: number;
  maxVolume?: number;
  minChange24h?: number;
  maxChange24h?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPulse?: number;
  maxPulse?: number;
  hasWhaleActivity?: boolean;
  hasSmartMoney?: boolean;
};

export type HunterResult = {
  token: {
    id: string;
    symbol: string;
    name: string;
    address: string;
  };
  chain: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  pulse: number;
  whaleActivity: boolean;
  smartMoney: boolean;
  signals: string[]; // Array of signal types
  score: number; // 0-100 overall score
};

export async function huntSignals(filters: HunterFilter): Promise<HunterResult[]> {
  try {
    // Get data from various sources
    const [movers, pulseSummary] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&price_change_percentage=24h')
        .then((r) => r.json())
        .catch(() => []),
      fetch('/api/pulse/stream')
        .then((r) => r.json())
        .catch(() => []),
    ]);

    // Combine and score
    const results: HunterResult[] = [];

    for (const coin of movers || []) {
      // Get pulse for this token
      const tokenPulses = pulseSummary?.filter(
        (p: any) => p.tokenSymbol?.toLowerCase() === coin.symbol?.toLowerCase()
      ) || [];
      const avgPulse = tokenPulses.length > 0
        ? tokenPulses.reduce((sum: number, p: any) => sum + p.pulse, 0) / tokenPulses.length
        : 0;

      const signals: string[] = [];
      if (coin.price_change_percentage_24h > 20) signals.push('momentum');
      if (coin.total_volume > coin.market_cap * 0.1) signals.push('high-volume');
      if (avgPulse > 70) signals.push('high-pulse');
      if (coin.price_change_percentage_24h > 50) signals.push('explosive');

      // Calculate overall score
      const volumeScore = Math.min((coin.total_volume / coin.market_cap) * 50, 30);
      const changeScore = Math.min(Math.abs(coin.price_change_percentage_24h) * 0.5, 30);
      const pulseScore = avgPulse * 0.4;
      const score = Math.min(Math.floor(volumeScore + changeScore + pulseScore), 100);

      // Apply filters
      if (filters.minVolume && coin.total_volume < filters.minVolume) continue;
      if (filters.maxVolume && coin.total_volume > filters.maxVolume) continue;
      if (filters.minChange24h && coin.price_change_percentage_24h < filters.minChange24h) continue;
      if (filters.maxChange24h && coin.price_change_percentage_24h > filters.maxChange24h) continue;
      if (filters.minMarketCap && coin.market_cap < filters.minMarketCap) continue;
      if (filters.maxMarketCap && coin.market_cap > filters.maxMarketCap) continue;
      if (filters.minPulse && avgPulse < filters.minPulse) continue;
      if (filters.maxPulse && avgPulse > filters.maxPulse) continue;

      results.push({
        token: {
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          address: '', // Would need to fetch from another API
        },
        chain: 'ethereum', // Default, would detect from data
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        pulse: Math.floor(avgPulse),
        whaleActivity: avgPulse > 70,
        smartMoney: signals.includes('high-pulse'),
        signals,
        score,
      });
    }

    return results.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Failed to hunt signals:', error);
    return [];
  }
}
