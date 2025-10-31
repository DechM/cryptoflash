import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUSD, formatCompactUSD, formatPercent } from '@/lib/format';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type TickerCardProps = {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  isLoading?: boolean;
};

export function TickerCard({ name, symbol, price, change24h, volume24h, isLoading }: TickerCardProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-8 w-40 bg-muted rounded" />
          <div className="h-6 w-20 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = change24h > 0;
  const isNegative = change24h < 0;
  const isNeutral = change24h === 0;

  const badgeVariant = isPositive ? 'success' : isNeutral ? 'outline' : 'destructive';

  return (
    <Card className="transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          <span className="text-sm font-normal text-muted-foreground uppercase">{symbol}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold">{formatUSD(price)}</div>
        <div className="flex items-center gap-2">
          <Badge variant={badgeVariant} className={cn('gap-1', changeColor)}>
            {isPositive && <ArrowUp className="h-3 w-3" />}
            {isNegative && <ArrowDown className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            {formatPercent(change24h)}
          </Badge>
          <span className="text-xs text-muted-foreground">24h</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Vol 24h: <span className="font-medium">{formatCompactUSD(volume24h)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
