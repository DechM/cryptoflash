'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatUSD, formatPercent } from '@/lib/format';
import Link from 'next/link';
import { TrendingUp, Trophy, Target, Activity } from 'lucide-react';
import type { TrackedWallet } from '@/lib/whales/types';

type Props = {
  byProfit: TrackedWallet[];
  byWinRate: TrackedWallet[];
  byTrades: TrackedWallet[];
};

export function Leaderboard({ byProfit, byWinRate, byTrades }: Props) {
  return (
    <Tabs defaultValue="profit" className="space-y-4">
      <TabsList>
        <TabsTrigger value="profit" className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          By Profit
        </TabsTrigger>
        <TabsTrigger value="winrate" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          By Win Rate
        </TabsTrigger>
        <TabsTrigger value="trades" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          By Trades
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profit">
        <LeaderboardTable wallets={byProfit} metric="profit" />
      </TabsContent>

      <TabsContent value="winrate">
        <LeaderboardTable wallets={byWinRate} metric="winrate" />
      </TabsContent>

      <TabsContent value="trades">
        <LeaderboardTable wallets={byTrades} metric="trades" />
      </TabsContent>
    </Tabs>
  );
}

function LeaderboardTable({
  wallets,
  metric,
}: {
  wallets: TrackedWallet[];
  metric: 'profit' | 'winrate' | 'trades';
}) {
  if (wallets.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No wallets to display.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {metric === 'profit' && 'Top by Total Profit'}
          {metric === 'winrate' && 'Top by Win Rate'}
          {metric === 'trades' && 'Top by Total Trades'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {wallets.map((wallet, idx) => (
            <LeaderboardRow key={wallet.address} wallet={wallet} rank={idx + 1} metric={metric} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardRow({
  wallet,
  rank,
  metric,
}: {
  wallet: TrackedWallet;
  rank: number;
  metric: 'profit' | 'winrate' | 'trades';
}) {
  const isTop3 = rank <= 3;
  const medalColors = {
    1: 'text-yellow-500',
    2: 'text-gray-400',
    3: 'text-orange-600',
  };

  return (
    <Link href={`/wallet/${encodeURIComponent(wallet.address)}`}>
      <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
        <div className={`w-8 text-center font-bold ${isTop3 ? medalColors[rank as keyof typeof medalColors] : 'text-muted-foreground'}`}>
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">{wallet.label}</span>
            <Badge variant="outline" className="text-xs">
              {wallet.category}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground font-mono truncate">
            {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          {metric === 'profit' && (
            <>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
                <div className="flex items-center gap-1">
                  {wallet.totalProfitUsd > 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                  )}
                  <span
                    className={
                      wallet.totalProfitUsd > 0
                        ? 'text-emerald-400 font-medium'
                        : 'text-red-400 font-medium'
                    }
                  >
                    {formatUSD(wallet.totalProfitUsd)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
                <div className="font-medium">{formatPercent(wallet.winRate / 100)}</div>
              </div>
            </>
          )}

          {metric === 'winrate' && (
            <>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
                <div className="font-medium">{formatPercent(wallet.winRate / 100)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
                <div className="font-medium">{formatUSD(wallet.totalProfitUsd)}</div>
              </div>
            </>
          )}

          {metric === 'trades' && (
            <>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Trades</div>
                <div className="font-medium">{wallet.totalTrades}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
                <div className="font-medium">{formatPercent(wallet.winRate / 100)}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

