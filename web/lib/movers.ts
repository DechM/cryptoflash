type CoinGeckoMarket = {
  id: string;
  symbol: string;
  name: string;
  image: string; // <-- ВАЖНО
  current_price: number;
  price_change_percentage_24h: number | null;
  market_cap: number;
  total_volume: number;
};

export type MoverData = {
  id: string;
  symbol: string;
  name: string;
  image?: string;      // <-- добавяме
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
};

export async function getMovers(): Promise<MoverData[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const url =
      "https://api.coingecko.com/api/v3/coins/markets" +
      "?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h";

    const response = await fetch(url, {
      next: { revalidate: 120 },
      signal: controller.signal,
      // CoinGecko е публично – не ни трябва API ключ
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = (await response.json()) as CoinGeckoMarket[];

    return data.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image, // <-- взимаме иконката
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h ?? 0,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
    }));
  } catch (error) {
    console.error("Failed to fetch movers data:", error);
    return [];
  }
}
