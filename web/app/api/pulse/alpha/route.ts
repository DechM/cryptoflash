import { NextResponse } from 'next/server';
import { getAlphaSignals, getAlphaWallets } from '@/lib/pulse/alpha';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'signals' or 'wallets'
    
    if (type === 'wallets') {
      const wallets = await getAlphaWallets();
      return NextResponse.json(wallets);
    }
    
    const signals = await getAlphaSignals();
    return NextResponse.json(signals);
  } catch (error) {
    console.error('Alpha signals API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
