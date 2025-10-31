import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TickerCard from '@/components/metrics/TickerCard';
import { RefreshButton } from '@/components/RefreshButton';
import { MoversTable } from '@/components/movers/MoversTable';
import { getTickers } from '@/lib/crypto';
import { getMovers } from '@/lib/movers';

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

