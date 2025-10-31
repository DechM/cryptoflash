'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TokenIcon from '@/components/icons/TokenIcon';
import { formatUSD, formatPercent, formatCompactUSD } from '@/lib/format';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Signal } from '@/lib/signals';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SignalsTable() {
  const { data: signals, error } = useSWR<Signal[]>('/api/signals', fetcher, {
    refreshInterval: 30000, // Poll every 30s
    revalidateOnFocus: true,
  });

  const [filterChain, setFilterChain] = useState<string>('all');

  const filteredSignals = useMemo(() => {
    if (!signals) return [];
    if (filterChain === 'all') return signals;
    return signals.filter((s) => s.chain === filterChain);
  }, [signals, filterChain]);

  const sortedSignals = useMemo(() => {
    return [...filteredSignals].sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
  }, [filteredSignals]);

  if (error) {
    return (
      <Alert variant="default">
        <AlertDescription>Signals temporarily unavailable. Retrying...</AlertDescription>
      </Alert>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <Alert variant="default">
        <AlertDescription>Signals temporarily unavailable.</AlertDescription>
      </Alert>
    );
  }

  const chains = Array.from(new Set(signals.map((s) => s.chain).filter(Boolean)));

  return (
    <div className="space-y-4">
      {chains.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterChain('all')}
            className={`px-3 py-1 rounded-md text-sm border transition-colors ${
              filterChain === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted'
            }`}
          >
            All
          </button>
          {chains.map((chain) => (
            <button
              key={chain}
              onClick={() => setFilterChain(chain || 'all')}
              className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                filterChain === chain
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              {chain}
            </button>
          ))}
        </div>
      )}

      {/* Desktop table view (md+) */}
      <div className="hidden md:block overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">24h %</TableHead>
              <TableHead className="text-right">Volume 24h</TableHead>
              <TableHead className="text-right">Liquidity</TableHead>
              <TableHead>Chain/DEX</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSignals.map((signal) => {
              const badgeVariant =
                signal.reason === 'volume_spike'
                  ? 'default'
                  : signal.reason === 'new_pair'
                    ? 'secondary'
                    : 'destructive';

              return (
                <TableRow
                  key={signal.id}
                  className="hover:bg-muted/10 hover:shadow-[0_1px_0_rgba(255,255,255,0.06)] transition-all"
                >
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      <TokenIcon symbol={signal.symbol} size={20} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{signal.name}</div>
                        <div className="text-xs text-muted-foreground uppercase">{signal.symbol}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {signal.priceUsd ? formatUSD(signal.priceUsd) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {signal.change24h !== undefined ? (
                      <span
                        className={signal.change24h >= 0 ? 'text-green-400' : 'text-red-400'}
                      >
                        {formatPercent(signal.change24h)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCompactUSD(signal.volume24h || 0)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCompactUSD(signal.liquidityUsd || 0)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {signal.chain}/{signal.dex}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant}>{signal.reason.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {signal.url && (
                      <Link
                        href={signal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
                        aria-label={`Open ${signal.name} on Dexscreener`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile stacked view */}
      <div className="md:hidden space-y-3">
        {sortedSignals.map((signal) => {
          const badgeVariant =
            signal.reason === 'volume_spike'
              ? 'default'
              : signal.reason === 'new_pair'
                ? 'secondary'
                : 'destructive';

          return (
            <div
              key={signal.id}
              className="border rounded-lg p-4 space-y-2 hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <TokenIcon symbol={signal.symbol} size={20} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{signal.name}</div>
                    <div className="text-xs text-muted-foreground uppercase">{signal.symbol}</div>
                  </div>
                </div>
                <Badge variant={badgeVariant} className="shrink-0">
                  {signal.reason.replace('_', ' ')}
                </Badge>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-sm">
                {signal.priceUsd && (
                  <div>
                    <dt className="text-muted-foreground">Price</dt>
                    <dd className="font-medium">{formatUSD(signal.priceUsd)}</dd>
                  </div>
                )}
                {signal.change24h !== undefined && (
                  <div>
                    <dt className="text-muted-foreground">24h %</dt>
                    <dd
                      className={
                        signal.change24h >= 0 ? 'font-medium text-green-400' : 'font-medium text-red-400'
                      }
                    >
                      {formatPercent(signal.change24h)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Volume 24h</dt>
                  <dd className="font-medium">{formatCompactUSD(signal.volume24h || 0)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Liquidity</dt>
                  <dd className="font-medium">{formatCompactUSD(signal.liquidityUsd || 0)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Chain/DEX</dt>
                  <dd className="font-medium text-xs">
                    {signal.chain}/{signal.dex}
                  </dd>
                </div>
              </dl>

              {signal.url && (
                <Link
                  href={signal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
                  aria-label={`Open ${signal.name} on Dexscreener`}
                >
                  Open on Dexscreener <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
