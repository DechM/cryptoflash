import { NextResponse } from 'next/server';
import { huntSignals, type HunterFilter } from '@/lib/pulse/hunter';

export async function POST(request: Request) {
  try {
    const filters: HunterFilter = await request.json();
    const results = await huntSignals(filters);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Signal hunter API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
