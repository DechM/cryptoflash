type CoinGeckoMarket = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  image: string;
};

export type TickerData = {
  id: 'bitcoin' | 'ethereum';
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  updatedAt: number;
  image?: string;
};

let cachedData: TickerData[] | null = null;

export async function getTickers(): Promise<TickerData[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&price_change_percentage=24h&per_page=2&page=1',
        {
          next: { revalidate: 60 },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = (await response.json()) as CoinGeckoMarket[];

      const now = Date.now();
      const normalized: TickerData[] = data.map((coin) => ({
        id: coin.id as 'bitcoin' | 'ethereum',
        symbol: coin.symbol,
        name: coin.name,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h ?? 0,
        volume24h: coin.total_volume,
        updatedAt: now,
        image: coin.image,
      }));

      cachedData = normalized;
      return normalized;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Failed to fetch ticker data:', error);
    return cachedData ?? [];
  }
}
