import type { Metadata } from 'next';
import { MoneyFlowRadar } from '@/components/pulse/MoneyFlowRadar';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Money Flow Radar — CryptoFlash',
    description: 'Track large money movements across chains. Visualize whale transactions and capital flow in real-time.',
    alternates: {
      canonical: 'https://cryptoflash.app/radar',
    },
    openGraph: {
      title: 'Money Flow Radar — CryptoFlash',
      description: 'Track large money movements across chains.',
      url: 'https://cryptoflash.app/radar',
    },
  };
}

export default function RadarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Money Flow Radar</h1>
        <p className="text-muted-foreground">
          Track large capital movements across blockchain networks. Visualize whale transactions, shark trades,
          and dolphin activity in real-time. See where smart money is flowing.
        </p>
      </div>

      <MoneyFlowRadar />
    </div>
  );
}
