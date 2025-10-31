import { NextResponse } from 'next/server';
import { getMarkets } from '@/lib/predictions';

export async function GET() {
  try {
    const markets = await getMarkets();
    return NextResponse.json(markets);
  } catch (error) {
    console.error('Predictions API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
