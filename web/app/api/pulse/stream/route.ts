import { NextResponse } from 'next/server';
import { getPulseStream } from '@/lib/pulse/stream';

export async function GET() {
  try {
    const trades = await getPulseStream(100);
    return NextResponse.json(trades);
  } catch (error) {
    console.error('Pulse stream API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
