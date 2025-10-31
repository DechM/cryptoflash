'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCompactUSD } from '@/lib/format';
import { getTokenEmoji } from '@/lib/alerts/token-emoji';
import { ALERT_THRESHOLDS } from '@/lib/alerts/types';
import type { CryptoFlashAlert } from '@/lib/alerts/types';
import Link from 'next/link';
import { ExternalLink, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Props = {
  limit?: number;
  minAmountUsd?: number;
};

export function LatestAlertsFeed({ limit = 20, minAmountUsd = ALERT_THRESHOLDS.low }: Props) {
  const { data: alerts, error, isLoading } = useSWR<CryptoFlashAlert[]>(
    `/api/alerts?minAmountUsd=${minAmountUsd}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const displayedAlerts = alerts?.slice(0, limit) || [];

  if (error) {
    return (
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Latest Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Failed to load alerts. Retrying...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/50 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Latest Alerts
          </CardTitle>
          {alerts && (
            <Badge variant="outline" className="text-xs">
              {alerts.length} total
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-muted/30 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : displayedAlerts.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No alerts available. Waiting for large transactions...
          </div>
        ) : (
          <div className="divide-y divide-border/50 max-h-[800px] overflow-y-auto">
            {displayedAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertCard({ alert }: { alert: CryptoFlashAlert }) {
  const isPositive = alert.alertType === 'whale_buy' || alert.alertType === 'exchange_withdrawal';
  const severityColors = {
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <Link
      href={`/alerts/${alert.id}`}
      className="block hover:bg-primary/5 transition-colors group relative"
    >
      <div
        className={`p-4 ${alert.isNew ? 'animate-fade-in bg-primary/10' : ''}`}
      >
        {/* Header: Token, Amount, Severity */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl shrink-0">
              {getTokenEmoji(alert?.token?.symbol || 'BTC') || '🪙'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate">
                  {formatCompactUSD(alert?.token?.amountUsd || 0)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {alert?.token?.symbol || 'UNKNOWN'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {alert?.blockchain?.toUpperCase() || 'UNKNOWN'}
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${severityColors[alert?.severity || 'low']}`}
          >
            {alert?.severity || 'low'}
          </Badge>
        </div>

        {/* Transaction Details */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            <div className="flex-1 min-w-0">
              <div className="truncate">
                <span className="font-medium">{alert?.from?.label || 'Unknown Wallet'}</span>
                {alert?.from?.address && (
                  <span className="text-muted-foreground/70 ml-1">
                    ({alert.from.address.substring(0, 6)}...{alert.from.address.slice(-4)})
                  </span>
                )}
                <span className="mx-1">→</span>
                <span className="font-medium">{alert?.to?.[0]?.label || 'Unknown Wallet'}</span>
                {alert?.to?.[0]?.address && (
                  <span className="text-muted-foreground/70 ml-1">
                    ({alert.to[0].address.substring(0, 6)}...{alert.to[0].address.slice(-4)})
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>{alert.timeAgo}</span>
            {alert.xPostUrl && (
              <a
                href={alert.xPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                View on X
              </a>
            )}
          </div>
        </div>

        {/* Arrow indicator on hover */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

