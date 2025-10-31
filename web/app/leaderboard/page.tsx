import type { Metadata } from 'next';
import { Leaderboard } from '@/components/whales/Leaderboard';
import { getTrackedWallets } from '@/lib/whales/tracker';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Leaderboard — CryptoFlash Hub',
    description: 'Top performing whale wallets ranked by profitability, win rate, and trading volume.',
    alternates: {
      canonical: 'https://cryptoflash.app/leaderboard',
    },
  };
}

export default async function LeaderboardPage() {
  const wallets = await getTrackedWallets();

  // Sort by various metrics
  const byProfit = [...wallets].sort((a, b) => b.totalProfitUsd - a.totalProfitUsd);
  const byWinRate = [...wallets].sort((a, b) => b.winRate - a.winRate);
  const byTrades = [...wallets].sort((a, b) => b.totalTrades - a.totalTrades);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">
          Top performing wallets ranked by key metrics
        </p>
      </div>
      <Leaderboard
        byProfit={byProfit}
        byWinRate={byWinRate}
        byTrades={byTrades}
      />
    </div>
  );
}

