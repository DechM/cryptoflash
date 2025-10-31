// web/lib/movers.ts
type CoinGeckoMarket = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string; // ✅
};

export type MoverData = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  image?: string; // ✅
};

export async function getMovers(): Promise<MoverData[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h',
      { next: { revalidate: 120 }, signal: controller.signal }
    );

    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);

    const data = (await res.json()) as CoinGeckoMarket[];
    return data.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      price: c.current_price,
      change24h: c.price_change_percentage_24h ?? 0,
      marketCap: c.market_cap,
      volume24h: c.total_volume,
      image: c.image, // ✅
    }));
  } catch (err) {
    console.error('Failed to fetch movers data:', err);
    return [];
  }
}
