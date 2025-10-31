import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { WalletDetail } from '@/components/whales/WalletDetail';
import { getTrackedWallets, getWalletTransactions, getWalletPositions } from '@/lib/whales/tracker';
import { getSignalsForWallet } from '@/lib/whales/signals';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  const wallets = await getTrackedWallets();
  const wallet = wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());

  if (!wallet) {
    return {
      title: 'Wallet Not Found — CryptoFlash Hub',
    };
  }

  return {
    title: `${wallet.label} — CryptoFlash Hub`,
    description: `Track ${wallet.label} wallet activity, positions, P&L, and trading signals.`,
    alternates: {
      canonical: `https://cryptoflash.app/wallet/${address}`,
    },
  };
}

export default async function WalletDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const wallets = await getTrackedWallets();
  const wallet = wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());

  if (!wallet) {
    notFound();
  }

  const [transactions, positions, signals] = await Promise.all([
    getWalletTransactions(address, 50),
    getWalletPositions(address),
    getSignalsForWallet(address, 20),
  ]);

  return (
    <WalletDetail
      wallet={{ ...wallet, positions }}
      transactions={transactions}
      signals={signals}
    />
  );
}

