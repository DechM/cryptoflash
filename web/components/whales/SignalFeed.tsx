'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUSD } from '@/lib/format';
import Link from 'next/link';
import { Zap, AlertTriangle, Radio } from 'lucide-react';
import type { WhaleSignal } from '@/lib/whales/types';
import { useState, useMemo } from 'react';

type Props = {
  signals: WhaleSignal[];
};

export function SignalFeed({ signals }: Props) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const filteredSignals = useMemo(() => {
    if (filter === 'all') return signals;
    return signals.filter((s) => s.severity === filter);
  }, [signals, filter]);

  const stats = {
    total: signals.length,
    critical: signals.filter((s) => s.severity === 'critical').length,
    high: signals.filter((s) => s.severity === 'high').length,
    medium: signals.filter((s) => s.severity === 'medium').length,
    low: signals.filter((s) => s.severity === 'low').length,
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterButton
          label="All"
          count={stats.total}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <FilterButton
          label="Critical"
          count={stats.critical}
          active={filter === 'critical'}
          onClick={() => setFilter('critical')}
          variant="critical"
        />
        <FilterButton
          label="High"
          count={stats.high}
          active={filter === 'high'}
          onClick={() => setFilter('high')}
          variant="high"
        />
        <FilterButton
          label="Medium"
          count={stats.medium}
          active={filter === 'medium'}
          onClick={() => setFilter('medium')}
          variant="medium"
        />
        <FilterButton
          label="Low"
          count={stats.low}
          active={filter === 'low'}
          onClick={() => setFilter('low')}
          variant="low"
        />
      </div>

      {/* Signals List */}
      {filteredSignals.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No signals found matching the selected filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSignals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
  variant = 'default',
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low';
}) {
  const variantClasses = {
    default: active
      ? 'bg-primary text-primary-foreground'
      : 'bg-muted text-muted-foreground hover:bg-muted/80',
    critical: active
      ? 'bg-orange-500 text-white border-orange-500'
      : 'bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500/20',
    high: active
      ? 'bg-red-500 text-white border-red-500'
      : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20',
    medium: active
      ? 'bg-yellow-500 text-white border-yellow-500'
      : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20',
    low: active
      ? 'bg-blue-500 text-white border-blue-500'
      : 'bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500/20',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${variantClasses[variant]}`}
    >
      {label} ({count})
    </button>
  );
}

function SignalCard({ signal }: { signal: WhaleSignal }) {
  const severityConfig = {
    critical: {
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
    },
    high: {
      icon: <Zap className="h-5 w-5" />,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
    },
    medium: {
      icon: <Zap className="h-5 w-5" />,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
    },
    low: {
      icon: <Radio className="h-5 w-5" />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
    },
  };

  const config = severityConfig[signal.severity];
  const isBuy = signal.transaction.type === 'buy';

  return (
    <Link href={`/wallet/${signal.wallet.address}`}>
      <Card className={`hover:border-primary/50 transition-all cursor-pointer ${config.bg} ${config.border}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={config.color}>{config.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{signal.wallet.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {signal.wallet.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{signal.reasoning}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge variant={isBuy ? 'success' : 'destructive'} className="text-xs">
                {signal.transaction.type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {signal.confidence}%
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                {signal.transaction.token.symbol}
              </span>
              <span className="font-medium">{formatUSD(signal.transaction.amountUsd)}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(signal.timestamp).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

