import type { Metadata } from 'next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NewsItem } from '@/components/news/NewsItem';
import { getNews, summarizeNewsItems } from '@/lib/news';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'AI Crypto Briefs — CryptoFlash',
    description: 'Latest crypto news from CoinDesk, The Block, and more with optional AI summaries.',
    alternates: {
      canonical: 'https://cryptoflash.app/news',
    },
    openGraph: {
      title: 'AI Crypto Briefs — CryptoFlash',
      description: 'Latest crypto news with AI summaries.',
      url: 'https://cryptoflash.app/news',
    },
  };
}

export default async function NewsPage() {
  let news = await getNews();

  // Optionally summarize if API key is available
  if (process.env.OPENAI_API_KEY && news.length > 0) {
    news = await summarizeNewsItems(news);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">AI Crypto Briefs</h1>
        <p className="text-muted-foreground">
          Curated crypto news from top sources with optional AI-powered summaries for quick insights.
        </p>
      </div>

      {news.length === 0 ? (
        <Alert variant="default">
          <AlertDescription>News temporarily unavailable.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <NewsItem
              key={item.id}
              id={item.id}
              title={item.title}
              url={item.url}
              source={item.source}
              publishedAt={item.publishedAt}
              summary={item.summary}
            />
          ))}
        </div>
      )}
    </div>
  );
}

