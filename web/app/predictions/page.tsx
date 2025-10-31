import type { Metadata } from 'next';
import { PredictionTable } from '@/components/predictions/PredictionTable';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Prediction Signals — CryptoFlash',
    description: 'Live prediction market odds from Polymarket with YES/NO prices and volume.',
    alternates: {
      canonical: 'https://cryptoflash.app/predictions',
    },
    openGraph: {
      title: 'Prediction Signals — CryptoFlash',
      description: 'Live prediction market odds from Polymarket.',
      url: 'https://cryptoflash.app/predictions',
    },
  };
}

export default function PredictionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Prediction Signals</h1>
        <p className="text-muted-foreground">
          Live prediction market data from Polymarket showing YES/NO prices, volume, and end dates.
        </p>
      </div>

      <PredictionTable />
    </div>
  );
}