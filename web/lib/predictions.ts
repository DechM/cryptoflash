export type Market = {
  id: string;
  question: string;
  yesPrice?: number;
  noPrice?: number;
  volume24h?: number;
  endDate?: string;
  url?: string;
};

type PolymarketMarket = {
  slug: string;
  question: string;
  outcomes: string[];
  endDate?: string;
  liquidity?: number;
  volume?: number;
  prices?: number[];
  clobTokenIds?: {
    yes?: string;
    no?: string;
  };
};

type PolymarketResponse = {
  data?: PolymarketMarket[];
};

export async function getMarkets(): Promise<Market[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        'https://gamma-api.polymarket.com/markets?limit=50&active=true',
        {
          next: { revalidate: 180 },
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.status}`);
      }

      const data = (await response.json()) as PolymarketResponse;

      if (!data.data || data.data.length === 0) {
        return [];
      }

      // Normalize to Market format
      const markets: Market[] = data.data.map((market) => {
        // Extract YES/NO prices (prices array typically has [yes, no] or similar)
        let yesPrice: number | undefined;
        let noPrice: number | undefined;

        if (market.prices && market.prices.length >= 2) {
          yesPrice = market.prices[0];
          noPrice = market.prices[1];
        } else if (market.prices && market.prices.length === 1) {
          yesPrice = market.prices[0];
          noPrice = 1 - yesPrice;
        }

        // Ensure prices are between 0 and 1
        if (yesPrice !== undefined) {
          yesPrice = Math.max(0, Math.min(1, yesPrice));
        }
        if (noPrice !== undefined) {
          noPrice = Math.max(0, Math.min(1, noPrice));
        }

        const url = `https://polymarket.com/event/${market.slug}`;

        return {
          id: market.slug,
          question: market.question,
          yesPrice,
          noPrice,
          volume24h: market.volume,
          endDate: market.endDate,
          url,
        };
      });

      // Sort by volume descending
      return markets.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Failed to fetch predictions data:', error);
    return [];
  }
}
