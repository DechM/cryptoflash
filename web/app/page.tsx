import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TickerCard from '@/components/metrics/TickerCard';
import { RefreshButton } from '@/components/RefreshButton';
import { MoversTable } from '@/components/movers/MoversTable';
import { getTickers } from '@/lib/crypto';
import { getMovers } from '@/lib/movers';
import { Radio, TrendingUp, Search, Activity } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'CryptoFlash — Real-time Crypto Signals',
    description: 'Market signals, prediction odds, AI briefs — fast.',
    alternates: {
      canonical: 'https://cryptoflash.app',
    },
    openGraph: {
      title: 'CryptoFlash — Real-time Crypto Signals',
      description: 'Market signals, prediction odds, AI briefs — fast.',
      url: 'https://cryptoflash.app',
    },
  };
}

export default async function HomePage() {
  const tickers = await getTickers();
  const movers = await getMovers();

  const btcTicker = tickers.find((t) => t.id === 'bitcoin');
  const ethTicker = tickers.find((t) => t.id === 'ethereum');

  return (
    <div className="container-grid">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Badge>Beta</Badge>
          <RefreshButton />
        </div>
      </div>
      {tickers.length === 0 ? (
        <Alert variant="default">
          <AlertDescription>Live market data temporarily unavailable. Retrying soon.</AlertDescription>
        </Alert>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {btcTicker && (
            <TickerCard
              name={btcTicker.name}
              symbol={btcTicker.symbol}
              price={btcTicker.price}
              change24h={btcTicker.change24h}
              volume24h={btcTicker.volume24h}
              updatedAt={btcTicker.updatedAt}
              imageUrl={btcTicker.image}
            />
          )}
          {ethTicker && (
            <TickerCard
              name={ethTicker.name}
              symbol={ethTicker.symbol}
              price={ethTicker.price}
              change24h={ethTicker.change24h}
              volume24h={ethTicker.volume24h}
              updatedAt={ethTicker.updatedAt}
              imageUrl={ethTicker.image}
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>Metric 3</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">--</div>
              <p className="text-sm text-muted-foreground">Placeholder description</p>
            </CardContent>
          </Card>
        </section>
      )}
      {/* Pulse Features Quick Access */}
      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Live Pulse Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/pulse">
                <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Pulse Stream</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Live real-time DEX trade feed with pulse intensity indicators
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/radar">
                <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Money Flow</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Track large capital movements with interactive radar visualization
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/alpha">
                <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Alpha Signals</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      AI-scored signals from profitable wallets with confidence scores
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/hunter">
                <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Signal Hunter</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Advanced token screener with filters for volume, pulse, and activity
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Trending Movers (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            {movers.length === 0 ? (
              <Alert variant="default">
                <AlertDescription>Movers temporarily unavailable.</AlertDescription>
              </Alert>
            ) : (
              <MoversTable data={movers} updatedAt={Date.now()} />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

