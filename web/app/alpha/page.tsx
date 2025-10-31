import type { Metadata } from 'next';
import { AlphaSignals } from '@/components/pulse/AlphaSignals';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Alpha Signals — CryptoFlash',
    description: 'AI-scored smart money signals. Follow profitable wallets and get alerts when they trade.',
    alternates: {
      canonical: 'https://cryptoflash.app/alpha',
    },
    openGraph: {
      title: 'Alpha Signals — CryptoFlash',
      description: 'AI-scored smart money signals.',
      url: 'https://cryptoflash.app/alpha',
    },
  };
}

export default function AlphaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Alpha Signals</h1>
        <p className="text-muted-foreground">
          AI-powered signals from profitable wallets. Track smart money movements with confidence scores.
          Follow top performers and get alerts when they make moves.
        </p>
      </div>

      <AlphaSignals />
    </div>
  );
}
