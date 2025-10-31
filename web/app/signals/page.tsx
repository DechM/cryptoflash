import type { Metadata } from 'next';
import { SignalsTable } from '@/components/signals/SignalsTable';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Market Signals — CryptoFlash',
    description: 'Real-time DEX signals and on-chain activity from Dexscreener.',
    alternates: {
      canonical: 'https://cryptoflash.app/signals',
    },
    openGraph: {
      title: 'Market Signals — CryptoFlash',
      description: 'Real-time DEX signals and on-chain activity.',
      url: 'https://cryptoflash.app/signals',
    },
  };
}

export default function SignalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Market Signals</h1>
        <p className="text-muted-foreground">
          Real-time DEX signals including volume spikes, new pairs, and whale trades from Dexscreener.
        </p>
      </div>

      <SignalsTable />
    </div>
  );
}