import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUSD, formatCompactUSD, formatPercent, formatTimeAgo } from '@/lib/format';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { TokenIcon } from '@/components/icons/TokenIcon';
import { cn } from '@/lib/utils';

type TickerCardProps = {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  updatedAt?: number;
  isLoading?: boolean;
};

export function TickerCard({ name, symbol, price, change24h, volume24h, updatedAt, isLoading }: TickerCardProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TokenIcon symbol={symbol} size={18} className="text-muted-foreground" />
            <span className="uppercase">{displayName}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="h-9 md:h-11 w-40 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = change24h > 0;
  const isNegative = change24h < 0;
  const isNeutral = change24h === 0;

  const badgeVariant = isPositive ? 'success' : isNeutral ? 'outline' : 'destructive';

  const displayName = symbol.toUpperCase() === 'BTC' ? 'BTC (Bitcoin)' : symbol.toUpperCase() === 'ETH' ? 'ETH (Ethereum)' : name;

  const symbolUpper = symbol.toUpperCase();
  const glowClass =
    symbolUpper === 'BTC'
      ? 'shadow-[0_0_40px_rgba(255,153,0,0.12)] hover:shadow-[0_0_64px_rgba(255,153,0,0.18)]'
      : symbolUpper === 'ETH'
        ? 'shadow-[0_0_40px_rgba(129,102,255,0.12)] hover:shadow-[0_0_64px_rgba(129,102,255,0.18)]'
        : '';

  return (
    <Card className={cn('transition-all duration-300 hover:border-primary/40 bg-gradient-to-br from-card to-card/50 hover:shadow-md', glowClass)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TokenIcon symbol={symbol} size="md" className="text-muted-foreground" />
          <span>{displayName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <div>
            <dt className="sr-only">Current Price</dt>
            <dd className="text-3xl md:text-4xl font-semibold">{formatUSD(price)}</dd>
          </div>
          <div>
            <dt className="sr-only">24 Hour Change</dt>
            <dd className="flex items-center gap-2">
              <Badge variant={badgeVariant} className="gap-1" aria-label="24h change">
                {isPositive && <ArrowUp className="h-3 w-3" />}
                {isNegative && <ArrowDown className="h-3 w-3" />}
                {isNeutral && <Minus className="h-3 w-3" />}
                {formatPercent(change24h)}
              </Badge>
              <span className="text-xs text-muted-foreground">24h</span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">24 Hour Volume</dt>
            <dd className="text-sm text-muted-foreground">
              Vol 24h: <span className="font-medium">{formatCompactUSD(volume24h)}</span>
            </dd>
          </div>
          {updatedAt && (
            <div>
              <dt className="sr-only">Last Updated</dt>
              <dd className="text-xs text-muted-foreground/70">Updated • {formatTimeAgo(updatedAt)}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
