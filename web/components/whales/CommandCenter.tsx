'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Zap, AlertTriangle, Radio } from 'lucide-react';
import type { WhaleSignal, TrackedWallet } from '@/lib/whales/types';
import { formatUSD, formatPercent } from '@/lib/format';
import Link from 'next/link';

type Props = {
  signals: WhaleSignal[];
  wallets: TrackedWallet[];
  stats: {
    totalSignals24h: number;
    topPerformer: TrackedWallet | null;
    totalVolume24h: number;
    activeWallets: number;
  };
};

export function CommandCenter({ signals, wallets, stats }: Props) {
  const criticalSignals = signals.filter((s) => s.severity === 'critical').slice(0, 3);
  const recentSignals = signals.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Command Center Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1">Real-time whale intelligence & signal tracking</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Signals (24h)"
          value={stats.totalSignals24h.toString()}
          trend={stats.totalSignals24h > 50 ? 'up' : 'neutral'}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Volume (24h)"
          value={formatUSD(stats.totalVolume24h)}
          trend="up"
          className="border-l-4 border-l-emerald-500"
        />
        <StatCard
          icon={<Radio className="h-5 w-5" />}
          label="Active Wallets"
          value={stats.activeWallets.toString()}
          trend="neutral"
          className="border-l-4 border-l-purple-500"
        />
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label="Top Performer"
          value={stats.topPerformer?.label || 'N/A'}
          trend={stats.topPerformer ? 'up' : 'neutral'}
          className="border-l-4 border-l-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Signals */}
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Critical Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalSignals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No critical signals at the moment.</p>
            ) : (
              criticalSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} compact />
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSignals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              recentSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} compact />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/wallets">
              <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Radio className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Whale Wallets</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Track {wallets.length} monitored wallets and their positions
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/signals">
              <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Live Signals</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Real-time signal feed with AI-powered scoring
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/leaderboard">
              <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Leaderboard</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Top performing wallets ranked by profitability
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-muted-foreground">{icon}</div>
          {trend === 'up' && <Badge variant="success" className="text-xs">↑</Badge>}
          {trend === 'down' && <Badge variant="destructive" className="text-xs">↓</Badge>}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

function SignalCard({
  signal,
  compact = false,
}: {
  signal: WhaleSignal;
  compact?: boolean;
}) {
  const severityColors = {
    critical: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    high: 'text-red-500 bg-red-500/10 border-red-500/30',
    medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  };

  return (
    <Link href={`/wallet/${signal.wallet.address}`}>
      <div className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{signal.wallet.label}</span>
              <Badge variant="outline" className={severityColors[signal.severity]}>
                {signal.severity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{signal.reasoning}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {signal.transaction.token.symbol} • {formatUSD(signal.transaction.amountUsd)}
          </span>
          <Badge variant="outline" className="font-mono">
            {signal.confidence}%
          </Badge>
        </div>
      </div>
    </Link>
  );
}

