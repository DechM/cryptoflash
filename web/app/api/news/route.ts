import { NextResponse } from 'next/server';
import { getNews, summarizeNewsItems } from '@/lib/news';

export async function GET() {
  try {
    let news = await getNews();

    // Optionally summarize if API key is available
    if (process.env.OPENAI_API_KEY && news.length > 0) {
      news = await summarizeNewsItems(news);
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
