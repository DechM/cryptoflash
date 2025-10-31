'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCompactUSD } from '@/lib/format';
import { TrendingUp, Coins } from 'lucide-react';
import useSWR from 'swr';

type MarketStats = {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function LiveMarketStats() {
  const { data: marketData, error } = useSWR<MarketStats>(
    '/api/market/stats',
    fetcher,
    {
      refreshInterval: 10000, // Update every 10 seconds
      revalidateOnFocus: true,
    }
  );

  if (error) {
    return null;
  }

  if (!marketData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-muted/50 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="glass-card bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 hover-scale animate-fade-in">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Market Cap
            </div>
            <TrendingUp className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <div className="text-2xl font-bold gradient-text">
            {formatCompactUSD(marketData.totalMarketCap)}
          </div>
        </CardContent>
      </Card>

      <Card
        className="glass-card bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 hover-scale animate-fade-in"
        style={{ animationDelay: '0.1s' }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              24h Volume
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {formatCompactUSD(marketData.totalVolume)}
          </div>
        </CardContent>
      </Card>

      <Card
        className="glass-card bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20 hover-scale animate-fade-in"
        style={{ animationDelay: '0.2s' }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              BTC Dominance
            </div>
            <span className="text-lg">₿</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {marketData.btcDominance.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      <Card
        className="glass-card bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 hover-scale animate-fade-in"
        style={{ animationDelay: '0.3s' }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              ETH Dominance
            </div>
            <span className="text-lg">Ξ</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {marketData.ethDominance.toFixed(1)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

