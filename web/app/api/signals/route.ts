import { NextResponse } from 'next/server';
import { getSignals } from '@/lib/signals';

export async function GET() {
  try {
    const signals = await getSignals();
    return NextResponse.json(signals);
  } catch (error) {
    console.error('Signals API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
