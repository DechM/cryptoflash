import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch coin data from CoinGecko
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const [coinResponse, marketChartResponse] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
        {
          signal: controller.signal,
          next: { revalidate: 10 },
        }
      ),
      fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7&interval=hourly`,
        {
          signal: controller.signal,
          next: { revalidate: 10 },
        }
      ),
    ]);

    clearTimeout(timeoutId);

    if (!coinResponse.ok || !marketChartResponse.ok) {
      throw new Error('CoinGecko API error');
    }

    const [coinData, chartData] = await Promise.all([
      coinResponse.json(),
      marketChartResponse.json(),
    ]);

    // Format OHLC data from price data
    const prices = chartData.prices || [];
    const ohlcData = prices
      .filter(([timestamp, price]: [number, number]) => timestamp && price && !isNaN(price) && price > 0)
      .map(([timestamp, price]: [number, number]) => ({
        time: Math.floor(timestamp / 1000),
        value: price,
      }));

    // Calculate 7d change if not provided
    let priceChange7d = coinData.market_data?.price_change_percentage_7d;
    if ((!priceChange7d || isNaN(priceChange7d)) && prices.length > 0) {
      const price7dAgo = prices[0]?.[1];
      const currentPrice = coinData.market_data?.current_price?.usd || 0;
      if (price7dAgo && currentPrice && price7dAgo > 0) {
        priceChange7d = ((currentPrice - price7dAgo) / price7dAgo) * 100;
      } else {
        priceChange7d = 0;
      }
    }

    const formattedData = {
      id: coinData.id,
      name: coinData.name,
      symbol: coinData.symbol?.toUpperCase() || '',
      image: coinData.image?.large || coinData.image?.small || '',
      current_price: coinData.market_data?.current_price?.usd || 0,
      market_cap: coinData.market_data?.market_cap?.usd || 0,
      market_cap_rank: coinData.market_cap_rank || null,
      total_volume: coinData.market_data?.total_volume?.usd || 0,
      high_24h: coinData.market_data?.high_24h?.usd || 0,
      low_24h: coinData.market_data?.low_24h?.usd || 0,
      price_change_24h: coinData.market_data?.price_change_24h || 0,
      price_change_percentage_24h: coinData.market_data?.price_change_percentage_24h || 0,
      price_change_percentage_7d: priceChange7d || 0,
      circulating_supply: coinData.market_data?.circulating_supply || 0,
      total_supply: coinData.market_data?.total_supply || 0,
      max_supply: coinData.market_data?.max_supply || null,
      ath: coinData.market_data?.ath?.usd || 0,
      ath_change_percentage: coinData.market_data?.ath_change_percentage?.usd || 0,
      atl: coinData.market_data?.atl?.usd || 0,
      atl_change_percentage: coinData.market_data?.atl_change_percentage?.usd || 0,
      description: coinData.description?.en || '',
      homepage: coinData.links?.homepage?.[0] || '',
      blockchain_site: coinData.links?.blockchain_site || [],
      chart_data: ohlcData,
      last_updated: coinData.last_updated,
    };

    return NextResponse.json(formattedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Coin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin data' },
      { status: 500 }
    );
  }
}

