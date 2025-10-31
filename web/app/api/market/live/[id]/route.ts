import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch from CoinGecko API (server-side, no CORS issues)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`,
      {
        signal: controller.signal,
        next: { revalidate: 10 },
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('CoinGecko API error');
    }

    const data = await response.json();
    const coinData = data[id];

    if (!coinData) {
      return NextResponse.json(
        { error: 'Coin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        price: coinData.usd || 0,
        change24h: coinData.usd_24h_change
          ? coinData.usd_24h_change / 100
          : 0,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Live price API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live price' },
      { status: 500 }
    );
  }
}

