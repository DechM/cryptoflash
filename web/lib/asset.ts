export type AssetData = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  currentPrice: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  homepage?: string;
  twitter?: string;
  explorer?: string;
  description?: string;
};

export async function getAssetData(id: string): Promise<AssetData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true`,
      {
        next: { revalidate: 60 },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      image: data.image?.large || data.image?.small || '',
      currentPrice: data.market_data?.current_price?.usd ?? 0,
      change24h: data.market_data?.price_change_percentage_24h ?? 0,
      marketCap: data.market_data?.market_cap?.usd ?? 0,
      volume24h: data.market_data?.total_volume?.usd ?? 0,
      circulatingSupply: data.market_data?.circulating_supply ?? 0,
      homepage: data.links?.homepage?.[0],
      twitter: data.links?.twitter_screen_name
        ? `https://twitter.com/${data.links.twitter_screen_name}`
        : undefined,
      explorer: data.links?.blockchain_site?.[0],
      description: data.description?.en?.slice(0, 500) || undefined,
    };
  } catch (error) {
    console.error(`Failed to fetch asset data for ${id}:`, error);
    return null;
  }
}

export type OHLCData = {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
};

export async function getAssetOHLC(id: string, days: number = 7): Promise<OHLCData[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`,
      {
        next: { revalidate: 300 },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    // CoinGecko returns: [[timestamp, open, high, low, close], ...]
    return data.map((item: number[]) => ({
      time: Math.floor(item[0] / 1000), // Convert to seconds
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
    }));
  } catch (error) {
    console.error(`Failed to fetch OHLC data for ${id}:`, error);
    return [];
  }
}
