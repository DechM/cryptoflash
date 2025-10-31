import { NextResponse } from 'next/server';
import { getTopMarketData } from '@/lib/market';

export async function GET() {
  try {
    const marketData = await getTopMarketData(100);

    const totalMarketCap = marketData.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
    const totalVolume = marketData.reduce((sum, coin) => sum + (coin.total_volume || 0), 0);
    
    const btc = marketData.find((c) => c.id === 'bitcoin');
    const eth = marketData.find((c) => c.id === 'ethereum');

    const btcDominance = btc ? (btc.market_cap / totalMarketCap) * 100 : 0;
    const ethDominance = eth ? (eth.market_cap / totalMarketCap) * 100 : 0;

    return NextResponse.json({
      totalMarketCap,
      totalVolume,
      btcDominance,
      ethDominance,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Market stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market stats' },
      { status: 500 }
    );
  }
}

