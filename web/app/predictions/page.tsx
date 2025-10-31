import type { Metadata } from 'next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getMarkets } from '@/lib/predictions';
import { formatCompactUSD, formatTimeAgo, formatDecimal } from '@/lib/format';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Prediction Signals — CryptoFlash',
    description: 'Live prediction market odds from Polymarket with YES/NO prices and volume.',
    alternates: {
      canonical: 'https://cryptoflash.app/predictions',
    },
    openGraph: {
      title: 'Prediction Signals — CryptoFlash',
      description: 'Live prediction market odds from Polymarket.',
      url: 'https://cryptoflash.app/predictions',
    },
  };
}

export default async function PredictionsPage() {
  const markets = await getMarkets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Prediction Signals</h1>
        <p className="text-muted-foreground">
          Live prediction market data from Polymarket showing YES/NO prices, volume, and end dates.
        </p>
      </div>

      {markets.length === 0 ? (
        <Alert variant="default">
          <AlertDescription>Prediction markets temporarily unavailable.</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Desktop table view (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead className="text-right">YES</TableHead>
                  <TableHead className="text-right">NO</TableHead>
                  <TableHead className="text-right">24h Vol</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markets.map((market) => (
                  <TableRow
                    key={market.id}
                    className="hover:bg-muted/10 hover:shadow-[0_1px_0_rgba(255,255,255,0.06)] transition-all"
                  >
                    <TableCell>
                      <div className="font-medium max-w-md">{market.question}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {market.yesPrice !== undefined ? (
                        <span className="text-green-400 font-medium">
                          {formatDecimal(market.yesPrice)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {market.noPrice !== undefined ? (
                        <span className="text-rose-400 font-medium">
                          {formatDecimal(market.noPrice)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {market.volume24h ? formatCompactUSD(market.volume24h) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {market.endDate ? formatTimeAgo(market.endDate) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {market.url && (
                        <Link
                          href={market.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
                          aria-label={`Open ${market.question} on Polymarket`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile stacked view */}
          <div className="md:hidden space-y-3">
            {markets.map((market) => (
              <div
                key={market.id}
                className="border rounded-lg p-4 space-y-2 hover:bg-muted/10 transition-colors"
              >
                <h3 className="font-medium">{market.question}</h3>

                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">YES</dt>
                    <dd className="font-medium text-green-400">
                      {market.yesPrice !== undefined ? formatDecimal(market.yesPrice) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">NO</dt>
                    <dd className="font-medium text-rose-400">
                      {market.noPrice !== undefined ? formatDecimal(market.noPrice) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">24h Vol</dt>
                    <dd className="font-medium">
                      {market.volume24h ? formatCompactUSD(market.volume24h) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Ends</dt>
                    <dd className="font-medium text-xs">
                      {market.endDate ? formatTimeAgo(market.endDate) : '—'}
                    </dd>
                  </div>
                </dl>

                {market.url && (
                  <Link
                    href={market.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
                    aria-label={`Open ${market.question} on Polymarket`}
                  >
                    Open on Polymarket <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}