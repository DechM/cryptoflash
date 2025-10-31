import type { Metadata } from 'next';
import { PulseStream } from '@/components/pulse/PulseStream';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Pulse Stream — CryptoFlash',
    description: 'Live real-time DEX trade flow. Watch the pulse of crypto markets as trades happen.',
    alternates: {
      canonical: 'https://cryptoflash.app/pulse',
    },
    openGraph: {
      title: 'Pulse Stream — CryptoFlash',
      description: 'Live real-time DEX trade flow.',
      url: 'https://cryptoflash.app/pulse',
    },
  };
}

export default function PulsePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Pulse Stream</h1>
        <p className="text-muted-foreground">
          Live real-time feed of DEX trades. Watch the pulse of crypto markets as transactions flow through
          exchanges. Each trade shows intensity, direction, and impact.
        </p>
      </div>

      <PulseStream />
    </div>
  );
}
