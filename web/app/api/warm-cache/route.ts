import { NextResponse } from 'next/server';
import { getMovers } from '@/lib/movers';
import { getNews } from '@/lib/news';

export async function GET(request: Request) {
  // Optional: Add API key check for security
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.WARM_CACHE_TOKEN;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Warm up caches by fetching data
    const [movers, news] = await Promise.allSettled([
      getMovers(),
      getNews(),
    ]);

    return NextResponse.json({
      success: true,
      movers: movers.status === 'fulfilled' ? 'OK' : 'ERROR',
      news: news.status === 'fulfilled' ? 'OK' : 'ERROR',
    });
  } catch (error) {
    console.error('Warm cache error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to warm cache' },
      { status: 500 }
    );
  }
}
