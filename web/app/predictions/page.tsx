import type { Metadata } from 'next';

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
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p>Prediction markets will appear here.</p>
        <p className="text-sm mt-2">Coming soon...</p>
      </div>
    </div>
  );
}

