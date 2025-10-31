import type { Metadata } from 'next';
import { WalletList } from '@/components/whales/WalletList';
import { getTrackedWallets } from '@/lib/whales/tracker';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Whale Wallets — CryptoFlash Hub',
    description: 'Track monitored whale wallets, view their positions, P&L, and trading history.',
    alternates: {
      canonical: 'https://cryptoflash.app/wallets',
    },
  };
}

export default async function WalletsPage() {
  const wallets = await getTrackedWallets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Whale Wallets</h1>
        <p className="text-muted-foreground mt-1">
          Monitored wallets with real-time position tracking
        </p>
      </div>
      <WalletList wallets={wallets} />
    </div>
  );
}

