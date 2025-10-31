'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TokenIcon from '@/components/icons/TokenIcon';
import { formatUSD, formatPercent, formatCompactUSD, formatTimeAgo } from '@/lib/format';
import { ArrowUp, ArrowDown, Share2, ExternalLink } from 'lucide-react';
import { useLivePrice } from '@/hooks/useLivePrice';
import useSWR from 'swr';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { AssetData } from '@/lib/asset';

type Props = {
  asset: AssetData;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AssetHeader({ asset }: Props) {
  const isBtc = asset.id === 'bitcoin';
  const isEth = asset.id === 'ethereum';
  
  // Use live price for BTC/ETH
  const liveBtc = isBtc ? useLivePrice('BTCUSDT', 'bitcoin') : null;
  const liveEth = isEth ? useLivePrice('ETHUSDT', 'ethereum') : null;
  const liveData = liveBtc || liveEth;

  // Fallback polling for non-BTC/ETH or if WS fails
  const { data: priceData } = useSWR(
    liveData?.price ? null : `https://api.coingecko.com/api/v3/simple/price?ids=${asset.id}&vs_currencies=usd&include_24hr_change=true`,
    fetcher,
    { refreshInterval: 15000 }
  );

  const price = liveData?.price ?? priceData?.[asset.id]?.usd ?? asset.currentPrice;
  const change24h = liveData?.change24h ?? priceData?.[asset.id]?.usd_24h_change ?? asset.change24h;
  const hasWs = liveData?.hasWs ?? false;

  const isPositive = change24h > 0;

  const handleShare = () => {
    const text = `${asset.name} (${asset.symbol}): ${formatUSD(price)} ${formatPercent(change24h)}`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(
      `https://cryptoflash.app/asset/${asset.id}`
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {asset.image && (
              <div className="relative h-12 w-12 shrink-0">
                <Image
                  src={asset.image}
                  alt={asset.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <TokenIcon symbol={asset.symbol} size={24} imageUrl={asset.image} />
                {asset.name}
                <span className="text-muted-foreground font-normal">({asset.symbol})</span>
                {hasWs && (
                  <span
                    className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                    aria-label="live"
                    title="Live price feed"
                  />
                )}
              </CardTitle>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="text-4xl font-bold mb-2">{formatUSD(price)}</div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isPositive ? 'success' : 'destructive'}
              className="gap-1"
              aria-label="24h change"
            >
              {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {formatPercent(change24h)}
            </Badge>
            <span className="text-sm text-muted-foreground">24h</span>
          </div>
        </div>

        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Market Cap</dt>
            <dd className="font-semibold mt-1">{formatCompactUSD(asset.marketCap)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Volume 24h</dt>
            <dd className="font-semibold mt-1">{formatCompactUSD(asset.volume24h)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Circulating Supply</dt>
            <dd className="font-semibold mt-1">
              {asset.circulatingSupply > 0
                ? `${(asset.circulatingSupply / 1e9).toFixed(2)}B ${asset.symbol}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Price Change 24h</dt>
            <dd
              className={cn('font-semibold mt-1', isPositive ? 'text-green-400' : 'text-red-400')}
            >
              {formatPercent(change24h)}
            </dd>
          </div>
        </dl>

        {(asset.homepage || asset.twitter || asset.explorer) && (
          <div className="flex flex-wrap gap-2">
            {asset.homepage && (
              <Button variant="outline" size="sm" asChild>
                <a href={asset.homepage} target="_blank" rel="noopener noreferrer" className="gap-2">
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
            {asset.twitter && (
              <Button variant="outline" size="sm" asChild>
                <a href={asset.twitter} target="_blank" rel="noopener noreferrer" className="gap-2">
                  Twitter <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
            {asset.explorer && (
              <Button variant="outline" size="sm" asChild>
                <a href={asset.explorer} target="_blank" rel="noopener noreferrer" className="gap-2">
                  Explorer <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
