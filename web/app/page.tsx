import type { Metadata } from 'next';
import { CommandCenter } from '@/components/whales/CommandCenter';
import { getTrackedWallets } from '@/lib/whales/tracker';
import { generateSignals } from '@/lib/whales/signals';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'CryptoFlash Hub — Whale Signal Command Center',
    description: 'Real-time whale intelligence & signal tracking. Monitor smart money moves, track wallet positions, and get AI-powered trading signals.',
    alternates: {
      canonical: 'https://cryptoflash.app',
    },
    openGraph: {
      title: 'CryptoFlash Hub — Whale Signal Command Center',
      description: 'Real-time whale intelligence & signal tracking.',
      url: 'https://cryptoflash.app',
    },
  };
}

export default async function HomePage() {
  const allWallets = await getTrackedWallets();
  // Filter out wallets with $0 totalProfitUsd and 0 trades
  const wallets = allWallets.filter(w => w.totalProfitUsd > 0 || w.totalTrades > 0);
  const signals = await generateSignals(wallets);
  
  // Filter out signals with $0 amount
  const validSignals = signals.filter(s => s.transaction.amountUsd > 0);

  // Calculate stats
  const stats = {
    totalSignals24h: validSignals.filter(
      (s) => s.timestamp > Date.now() - 24 * 60 * 60 * 1000
    ).length,
    topPerformer: wallets.length > 0
      ? wallets.reduce((prev, curr) =>
          curr.totalProfitUsd > prev.totalProfitUsd ? curr : prev
        )
      : null,
    totalVolume24h: validSignals
      .filter((s) => s.timestamp > Date.now() - 24 * 60 * 60 * 1000)
      .reduce((sum, s) => sum + s.transaction.amountUsd, 0),
    activeWallets: wallets.filter(
      (w) => w.lastActivity > Date.now() - 24 * 60 * 60 * 1000
    ).length,
  };

  return <CommandCenter signals={validSignals} wallets={wallets} stats={stats} />;
}
