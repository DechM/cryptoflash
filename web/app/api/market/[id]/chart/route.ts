import { NextResponse } from 'next/server';

type TimeRange = '24h' | '7d' | '30d' | '1y' | 'all';

// Map time range to CoinGecko days parameter
function getDaysForRange(range: TimeRange): number | 'max' {
  switch (range) {
    case '24h':
      return 1;
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '1y':
      return 365;
    case 'all':
      return 'max';
    default:
      return 'max';
  }
}

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

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || 'all') as TimeRange;
    const type = searchParams.get('type') || 'price'; // 'price' or 'market_cap'

    const days = getDaysForRange(range);

    // Fetch chart data from CoinGecko
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let endpoint = '';
    if (type === 'market_cap') {
      // For market cap, we need to fetch coin data and calculate from market cap
      endpoint = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    } else {
      endpoint = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=${days === 1 ? 'hourly' : days === 7 ? 'hourly' : 'daily'}`;
    }

    const response = await fetch(endpoint, {
      signal: controller.signal,
      next: { revalidate: type === 'market_cap' ? 10 : range === 'all' ? 3600 : 600 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`CoinGecko chart API error (${response.status}) for ${id}:`, errorText);
      throw new Error(`Failed to fetch chart data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json().catch((err) => {
      console.error(`Failed to parse chart data JSON for ${id}:`, err);
      throw new Error('Invalid chart data response from CoinGecko');
    });

    let chartData: Array<{ time: number; value: number }> = [];

    if (type === 'market_cap') {
      // For market cap, we'll need to use market chart data and extract market cap
      // CoinGecko doesn't provide historical market cap directly, so we'll use price * supply
      const marketChartResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=${days === 1 ? 'hourly' : days === 7 ? 'hourly' : 'daily'}`,
        {
          signal: controller.signal,
          next: { revalidate: range === 'all' ? 3600 : 600 },
        }
      );

      if (marketChartResponse.ok) {
        const marketChart = await marketChartResponse.json();
        const prices = marketChart.prices || [];
        const circulatingSupply = data.market_data?.circulating_supply || 0;

        chartData = prices
          .filter(([timestamp, price]: [number, number]) => timestamp && price && !isNaN(price) && price > 0)
          .map(([timestamp, price]: [number, number]) => ({
            time: Math.floor(timestamp / 1000),
            value: price * circulatingSupply, // Approximate market cap
          }));
      }
    } else {
      // Price data
      if (!data || typeof data !== 'object' || !Array.isArray(data.prices)) {
        throw new Error('Invalid chart data structure from CoinGecko');
      }
      
      const prices = data.prices || [];
      chartData = prices
        .filter(([timestamp, price]: [number, number]) => {
          return timestamp && typeof timestamp === 'number' && 
                 price && typeof price === 'number' && 
                 !isNaN(price) && !isNaN(timestamp) && 
                 price > 0 && timestamp > 0;
        })
        .map(([timestamp, price]: [number, number]) => ({
          time: Math.floor(timestamp / 1000),
          value: price,
        }));
    }

    return NextResponse.json(
      {
        data: chartData,
        range,
        type,
      },
      {
        headers: {
          'Cache-Control':
            range === 'all'
              ? 'public, s-maxage=3600, stale-while-revalidate=7200'
              : 'public, s-maxage=600, stale-while-revalidate=1800',
        },
      }
    );
  } catch (error) {
    console.error('Chart API error:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}

