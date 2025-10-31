import type { Metadata } from 'next';

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
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p>News items will appear here.</p>
        <p className="text-sm mt-2">Coming soon...</p>
      </div>
    </div>
  );
}

