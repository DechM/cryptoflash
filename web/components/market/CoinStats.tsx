'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUSD, formatPercent, formatCompactUSD } from '@/lib/format';
import { TrendingUp, TrendingDown, ExternalLink, Globe, BarChart3 } from 'lucide-react';
import { LivePriceCell } from './LivePriceCell';

type CoinData = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  atl: number;
  atl_change_percentage: number;
  homepage: string;
  blockchain_site: string[];
};

type Props = {
  data: CoinData;
};

export function CoinStats({ data }: Props) {
  const isPositive24h = data.price_change_percentage_24h >= 0;
  const isPositive7d = data.price_change_percentage_7d >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <img
            src={data.image}
            alt={data.name}
            className="h-16 w-16 rounded-full"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {data.name}
              <span className="text-lg text-muted-foreground uppercase">
                {data.symbol}
              </span>
              {data.market_cap_rank && (
                <Badge variant="outline" className="ml-2">
                  #{data.market_cap_rank}
                </Badge>
              )}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-2xl font-semibold">
                <LivePriceCell price={data.current_price} coinId={data.id} />
              </div>
              <Badge
                variant={isPositive24h ? 'success' : 'destructive'}
                className="gap-1"
              >
                {isPositive24h ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {formatPercent(data.price_change_percentage_24h / 100)}
              </Badge>
            </div>
          </div>
        </div>

        {data.homepage && (
          <a
            href={data.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Globe className="h-5 w-5" />
          </a>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
            <div className="text-xl font-bold">{formatCompactUSD(data.market_cap)}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Volume (24h)</div>
            <div className="text-xl font-bold">{formatCompactUSD(data.total_volume)}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">24h High</div>
            <div className="text-xl font-bold text-emerald-400">
              {formatUSD(data.high_24h)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">24h Low</div>
            <div className="text-xl font-bold text-red-400">
              {formatUSD(data.low_24h)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">7 Day Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold flex items-center gap-2 ${
                isPositive7d ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isPositive7d ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {formatPercent(data.price_change_percentage_7d / 100)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">All-Time High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatUSD(data.ath)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatPercent(data.ath_change_percentage / 100)} from current
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">All-Time Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatUSD(data.atl)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatPercent(data.atl_change_percentage / 100)} from current
            </div>
          </CardContent>
        </Card>

        {data.circulating_supply > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Circulating Supply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {formatCompactUSD(data.circulating_supply)} {data.symbol}
              </div>
            </CardContent>
          </Card>
        )}

        {data.total_supply > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Total Supply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {formatCompactUSD(data.total_supply)} {data.symbol}
              </div>
            </CardContent>
          </Card>
        )}

        {data.max_supply && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Max Supply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {formatCompactUSD(data.max_supply)} {data.symbol}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

