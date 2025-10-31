import { NextResponse } from 'next/server';
import { getMoneyFlows } from '@/lib/pulse/radar';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = (searchParams.get('chain') as any) || 'ethereum';
    const minUsd = parseInt(searchParams.get('minUsd') || '10000', 10);
    
    const flows = await getMoneyFlows(chain, minUsd);
    return NextResponse.json(flows);
  } catch (error) {
    console.error('Money flow radar API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
