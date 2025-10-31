import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid coin ID' },
        { status: 400 }
      );
    }

    // Fetch coin data from CoinGecko
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`Request timeout for ${id}`);
    }, 30000); // Increased timeout to 30s for large responses

    const [coinResponse, marketChartResponse] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
        {
          signal: controller.signal,
          next: { revalidate: 10 },
        }
      ),
      fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=max&interval=daily`,
        {
          signal: controller.signal,
          next: { revalidate: 3600 }, // Cache for 1 hour for historical data
        }
      ),
    ]);

    clearTimeout(timeoutId);

    // Check individual response statuses for better error messages
    if (!coinResponse.ok) {
      const errorText = await coinResponse.text().catch(() => 'Unknown error');
      console.error(`CoinGecko coin API error (${coinResponse.status}):`, errorText);
      throw new Error(`Failed to fetch coin data: ${coinResponse.status} ${coinResponse.statusText}`);
    }

    if (!marketChartResponse.ok) {
      const errorText = await marketChartResponse.text().catch(() => 'Unknown error');
      console.error(`CoinGecko chart API error (${marketChartResponse.status}):`, errorText);
      throw new Error(`Failed to fetch chart data: ${marketChartResponse.status} ${marketChartResponse.statusText}`);
    }

    const [coinData, chartData] = await Promise.all([
      coinResponse.json().catch((err) => {
        console.error('Failed to parse coin data JSON:', err);
        throw new Error('Invalid coin data response from CoinGecko');
      }),
      marketChartResponse.json().catch((err) => {
        console.error('Failed to parse chart data JSON:', err);
        throw new Error('Invalid chart data response from CoinGecko');
      }),
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

    // Helper to safely get numeric value
    const getNumeric = (value: number | undefined | null, defaultValue = 0): number => {
      if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
        return defaultValue;
      }
      return Number(value);
    };

    const formattedData = {
      id: coinData.id || '',
      name: coinData.name || '',
      symbol: coinData.symbol?.toUpperCase() || '',
      image: coinData.image?.large || coinData.image?.small || '',
      current_price: getNumeric(coinData.market_data?.current_price?.usd),
      market_cap: getNumeric(coinData.market_data?.market_cap?.usd),
      market_cap_rank: coinData.market_cap_rank || null,
      total_volume: getNumeric(coinData.market_data?.total_volume?.usd),
      high_24h: getNumeric(coinData.market_data?.high_24h?.usd),
      low_24h: getNumeric(coinData.market_data?.low_24h?.usd),
      price_change_24h: getNumeric(coinData.market_data?.price_change_24h),
      price_change_percentage_24h: getNumeric(coinData.market_data?.price_change_percentage_24h),
      price_change_percentage_7d: getNumeric(priceChange7d),
      circulating_supply: getNumeric(coinData.market_data?.circulating_supply),
      total_supply: getNumeric(coinData.market_data?.total_supply),
      max_supply: coinData.market_data?.max_supply ? getNumeric(coinData.market_data.max_supply) : null,
      ath: getNumeric(coinData.market_data?.ath?.usd),
      ath_change_percentage: getNumeric(coinData.market_data?.ath_change_percentage?.usd),
      atl: getNumeric(coinData.market_data?.atl?.usd),
      atl_change_percentage: getNumeric(coinData.market_data?.atl_change_percentage?.usd),
      description: coinData.description?.en || '',
      homepage: coinData.links?.homepage?.[0] || '',
      blockchain_site: coinData.links?.blockchain_site || [],
      chart_data: ohlcData,
      market_cap_history: ohlcData.map((point: { time: number; value: number }) => ({
        time: point.time,
        value: point.value * getNumeric(coinData.market_data?.circulating_supply),
      })),
      last_updated: coinData.last_updated || new Date().toISOString(),
    };

    return NextResponse.json(formattedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error(`Coin API error for ${id}:`, error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      if (error.name === 'AbortError') {
        console.error('Request was aborted (timeout or cancelled)');
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Error stack:', error.stack);
      }
    }
    
    // Return appropriate status codes
    const statusCode = error instanceof Error && error.message.includes('timeout') ? 504 : 500;
    
    // Return 500 with error details in development, generic message in production
    return NextResponse.json(
      { 
        error: 'Failed to fetch coin data',
        message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: statusCode }
    );
  }
}

