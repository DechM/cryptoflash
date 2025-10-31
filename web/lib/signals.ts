export type Signal = {
  id: string;
  name: string;
  symbol: string;
  chain?: string;
  dex?: string;
  priceUsd?: number;
  change24h?: number;
  volume24h?: number;
  liquidityUsd?: number;
  reason: 'volume_spike' | 'new_pair' | 'whale_trade';
  url?: string;
};

type DexscreenerPair = {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  volume?: {
    h24?: number;
  };
  liquidity?: {
    usd?: number;
  };
  priceChange?: {
    h24?: number;
  };
  pairCreatedAt?: number;
  url?: string;
};

type DexscreenerResponse = {
  pairs: DexscreenerPair[];
};

export async function getSignals(): Promise<Signal[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Fetch trending/search results - using a generic search endpoint
      // Note: Dexscreener public API is limited; this is a simplified approach
      // In production, you might want to use specific token addresses or use their web scraping
      const response = await fetch(
        'https://api.dexscreener.com/latest/dex/search?q=',
        {
          next: { revalidate: 180 },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Dexscreener API error: ${response.status}`);
      }

      const data = (await response.json()) as DexscreenerResponse;

      if (!data.pairs || data.pairs.length === 0) {
        return [];
      }

      // Normalize to Signal format
      const signals: Signal[] = [];
      const seenPairs = new Set<string>();

      // If no pairs, try a fallback: fetch specific trending tokens
      if (!data.pairs || data.pairs.length === 0) {
        // Return empty for now - in production, you could fetch specific token pairs
        return [];
      }

      for (const pair of data.pairs.slice(0, 50)) {
        // Dedupe by pair address
        if (seenPairs.has(pair.pairAddress)) continue;
        seenPairs.add(pair.pairAddress);

        const baseToken = pair.baseToken;
        const priceUsd = pair.priceUsd ? parseFloat(pair.priceUsd) : undefined;
        const volume24h = pair.volume?.h24 || 0;
        const change24h = pair.priceChange?.h24;
        const liquidityUsd = pair.liquidity?.usd || 0;
        const pairAge = pair.pairCreatedAt ? Date.now() - pair.pairCreatedAt * 1000 : Infinity;

        // Determine reason
        let reason: Signal['reason'] = 'volume_spike';
        if (pairAge < 24 * 60 * 60 * 1000) {
          // Less than 24 hours old
          reason = 'new_pair';
        } else if (volume24h > liquidityUsd * 2 && liquidityUsd > 100000) {
          // High volume relative to liquidity suggests whale activity
          reason = 'whale_trade';
        }

        signals.push({
          id: pair.pairAddress,
          name: baseToken.name,
          symbol: baseToken.symbol,
          chain: pair.chainId,
          dex: pair.dexId,
          priceUsd,
          change24h,
          volume24h,
          liquidityUsd,
          reason,
          url: pair.url || `https://dexscreener.com/${pair.chainId}/${pair.pairAddress}`,
        });
      }

      // Sort by volume descending
      return signals.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Failed to fetch signals data:', error);
    return [];
  }
}
