import type { Metadata } from 'next';
import { MarketTable } from '@/components/market/MarketTable';
import { getTopMarketData } from '@/lib/market';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Coins } from 'lucide-react';
import { formatCompactUSD } from '@/lib/format';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Market — CryptoFlash Hub',
    description: 'Real-time cryptocurrency market data with prices, charts, market cap, and trading volume.',
    alternates: {
      canonical: 'https://cryptoflash.app/market',
    },
  };
}

export default async function MarketPage() {
  const marketData = await getTopMarketData(100);

  // Calculate market stats
  const totalMarketCap = marketData.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
  const totalVolume = marketData.reduce((sum, coin) => sum + (coin.total_volume || 0), 0);
  const btcDominance = marketData.find((c) => c.id === 'bitcoin');
  const ethDominance = marketData.find((c) => c.id === 'ethereum');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Coins className="h-8 w-8 text-primary" />
          Cryptocurrency Market
        </h1>
        <p className="text-muted-foreground mt-2">
          Real-time prices, market cap, volume, and 7-day charts
        </p>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 hover-scale animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Market Cap</div>
              <TrendingUp className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <div className="text-2xl font-bold gradient-text">{formatCompactUSD(totalMarketCap)}</div>
          </CardContent>
        </Card>

        <Card className="glass-card bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 hover-scale animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">24h Volume</div>
              <TrendingUp className="h-4 w-4 text-emerald-500 animate-pulse" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{formatCompactUSD(totalVolume)}</div>
          </CardContent>
        </Card>

        {btcDominance && (
          <Card className="glass-card bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20 hover-scale animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">BTC Dominance</div>
                <span className="text-lg">₿</span>
              </div>
              <div className="text-2xl font-bold text-orange-400">
                {((btcDominance.market_cap / totalMarketCap) * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        )}

        {ethDominance && (
          <Card className="glass-card bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 hover-scale animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">ETH Dominance</div>
                <span className="text-lg">Ξ</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {((ethDominance.market_cap / totalMarketCap) * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Market Table */}
      <Card className="glass-card border-border/50 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Top 100 Cryptocurrencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarketTable data={marketData} />
        </CardContent>
      </Card>
    </div>
  );
}

