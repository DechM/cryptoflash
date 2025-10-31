'use client';

import { MarketTable } from '@/components/market/MarketTable';
import { LiveMarketStats } from '@/components/market/LiveMarketStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins } from 'lucide-react';
import useSWR from 'swr';
import type { MarketCoin } from '@/lib/market';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function MarketPageClient() {
  const { data: marketData, error, isLoading } = useSWR<MarketCoin[]>(
    '/api/market?per_page=100',
    fetcher,
    {
      refreshInterval: 15000, // Update every 15 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

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

      {/* Live Market Stats */}
      <LiveMarketStats />

      {/* Market Table */}
      <Card className="glass-card border-border/50 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Top 100 Cryptocurrencies
            {marketData && (
              <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading market data...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              Failed to load market data. Please refresh.
            </div>
          ) : marketData ? (
            <MarketTable data={marketData} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

