// CoinGecko Market Data API
export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation?: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply?: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  sparkline_in_7d?: {
    price: number[];
  };
};

export async function getMarketData(
  page: number = 1,
  perPage: number = 100,
  vsCurrency: string = 'usd',
  order: 'market_cap_desc' | 'gecko_desc' | 'volume_desc' | 'market_cap_asc' = 'market_cap_desc'
): Promise<MarketCoin[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&order=${order}&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=24h%2C7d`,
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
    return data;
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    return [];
  }
}

export async function getTopMarketData(limit: number = 50): Promise<MarketCoin[]> {
  return getMarketData(1, limit);
}

