'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import TokenIcon from '@/components/icons/TokenIcon';
import { formatUSD, formatPercent, formatCompactUSD, formatTimeAgo } from '@/lib/format';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useLivePrice } from '@/hooks/useLivePrice';

type Props = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  updatedAt?: number;
  imageUrl?: string;
};

export default function TickerCard({
  symbol,
  name,
  price: initialPrice,
  change24h: initialChange24h,
  volume24h,
  updatedAt,
  imageUrl,
}: Props) {
  const symbolUpper = symbol.toUpperCase();
  
  // Use live price for BTC/ETH
  const isLive = symbolUpper === 'BTC' || symbolUpper === 'ETH';
  const liveBtc = symbolUpper === 'BTC' ? useLivePrice('BTCUSDT', 'bitcoin') : null;
  const liveEth = symbolUpper === 'ETH' ? useLivePrice('ETHUSDT', 'ethereum') : null;
  const liveData = liveBtc || liveEth;

  const price = liveData?.price ?? initialPrice;
  const change24h = liveData?.change24h ?? initialChange24h;
  const hasWs = liveData?.hasWs ?? false;

  const isPositive = change24h > 0;

  // Fix duplicate label: show "BTC (Bitcoin)" or "ETH (Ethereum)" only once
  const displayLabel =
    symbolUpper === 'BTC'
      ? 'BTC (Bitcoin)'
      : symbolUpper === 'ETH'
        ? 'ETH (Ethereum)'
        : name;

  const glowClass =
    symbolUpper === 'BTC'
      ? 'hover:shadow-[0_0_40px_rgba(255,153,0,0.12)] hover:shadow-[0_0_64px_rgba(255,153,0,0.18)]'
      : symbolUpper === 'ETH'
        ? 'hover:shadow-[0_0_40px_rgba(129,102,255,0.12)] hover:shadow-[0_0_64px_rgba(129,102,255,0.18)]'
        : '';

  return (
    <Card className={cn('bg-card border border-border shadow-sm transition-all duration-300', glowClass)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TokenIcon symbol={symbol} size={18} className="text-muted-foreground" imageUrl={imageUrl} />
          <span>{displayLabel}</span>
          {hasWs && (
            <span
              className="ml-2 inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
              aria-label="live"
              title="Live price feed"
            />
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-3xl font-semibold">{formatUSD(price)}</div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              isPositive ? 'text-green-400' : 'text-red-400'
            )}
          >
            {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {formatPercent(change24h)}
          </span>
          <span className="text-xs text-muted-foreground">24h</span>
        </div>

        <div className="text-xs text-muted-foreground">Vol 24h: {formatCompactUSD(volume24h)}</div>

        {updatedAt && (
          <div className="text-xs text-muted-foreground">Updated • {formatTimeAgo(updatedAt)}</div>
        )}
      </CardContent>
    </Card>
  );
}
