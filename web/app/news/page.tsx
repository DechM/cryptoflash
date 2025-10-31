import type { Metadata } from 'next';
import { NewsList } from '@/components/news/NewsList';

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

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">AI Crypto Briefs</h1>
        <p className="text-muted-foreground">
          Curated crypto news from top sources with optional AI-powered summaries for quick insights.
        </p>
      </div>

      <NewsList />
    </div>
  );
}