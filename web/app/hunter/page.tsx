import type { Metadata } from 'next';
import { SignalHunter } from '@/components/pulse/SignalHunter';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Signal Hunter — CryptoFlash',
    description: 'Advanced token screener with filters. Hunt for signals using volume, price change, pulse score, and more.',
    alternates: {
      canonical: 'https://cryptoflash.app/hunter',
    },
    openGraph: {
      title: 'Signal Hunter — CryptoFlash',
      description: 'Advanced token screener with filters.',
      url: 'https://cryptoflash.app/hunter',
    },
  };
}

export default function HunterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Signal Hunter</h1>
        <p className="text-muted-foreground">
          Hunt for trading signals using advanced filters. Find tokens by volume, price movement, pulse score,
          whale activity, and smart money indicators. Discover opportunities before they explode.
        </p>
      </div>

      <SignalHunter />
    </div>
  );
}
