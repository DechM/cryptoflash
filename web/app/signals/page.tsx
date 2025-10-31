import type { Metadata } from 'next';
import { SignalFeed } from '@/components/whales/SignalFeed';
import { getTrackedWallets } from '@/lib/whales/tracker';
import { generateSignals } from '@/lib/whales/signals';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Live Signals — CryptoFlash Hub',
    description: 'Real-time whale trading signals with AI-powered confidence scores and severity ratings.',
    alternates: {
      canonical: 'https://cryptoflash.app/signals',
    },
  };
}

export default async function SignalsPage() {
  const wallets = await getTrackedWallets();
  const signals = await generateSignals(wallets);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Signals</h1>
        <p className="text-muted-foreground mt-1">
          Real-time whale trading signals with AI-powered scoring
        </p>
      </div>
      <SignalFeed signals={signals} />
    </div>
  );
}

