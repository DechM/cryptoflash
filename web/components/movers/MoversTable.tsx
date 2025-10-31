'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TokenIcon } from '@/components/icons/TokenIcon';
import { formatUSD, formatPercent, formatCompactUSD } from '@/lib/format';
import { ArrowUp, ArrowDown, Share2 } from 'lucide-react';
import type { MoverData } from '@/lib/movers';

type MoversTableProps = {
  data: MoverData[];
  updatedAt?: number;
};

export function MoversTable({ data, updatedAt }: MoversTableProps) {
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');

  const topGainers = useMemo(() => {
    return [...data]
      .sort((a, b) => b.change24h - a.change24h)
      .filter((coin) => coin.change24h > 0)
      .slice(0, 10);
  }, [data]);

  const topLosers = useMemo(() => {
    return [...data]
      .sort((a, b) => a.change24h - b.change24h)
      .filter((coin) => coin.change24h < 0)
      .slice(0, 10);
  }, [data]);

  const activeData = activeTab === 'gainers' ? topGainers : topLosers;

  const handleShare = () => {
    const movers = activeData.slice(0, 5).map((coin) => `${coin.symbol.toUpperCase()} ${formatPercent(coin.change24h)}`);
    const text = `Top Crypto Movers (24h): ${movers.join(', ')} via CryptoFlash`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://cryptoflash.app')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Data refreshes every ~2 minutes</p>
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'gainers' | 'losers')}>
        <TabsList>
          <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
          <TabsTrigger value="losers">Top Losers</TabsTrigger>
        </TabsList>
        <TabsContent value="gainers" className="mt-4">
          <MoversTableView data={topGainers} />
        </TabsContent>
        <TabsContent value="losers" className="mt-4">
          <MoversTableView data={topLosers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type MoversTableViewProps = {
  data: MoverData[];
};

function MoversTableView({ data }: MoversTableViewProps) {
  if (data.length === 0) {
    return <div className="text-sm text-muted-foreground">No data available.</div>;
  }

  return (
    <>
      {/* Desktop table view (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">24h %</TableHead>
              <TableHead className="text-right">Volume 24h</TableHead>
              <TableHead className="text-right">Mkt Cap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((coin) => {
              const isPositive = coin.change24h > 0;
              const badgeVariant = isPositive ? 'success' : 'destructive';
              return (
                <TableRow key={coin.id} className="hover:bg-muted/10 hover:shadow-[0_1px_0_rgba(255,255,255,0.06)] transition-all">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={coin.symbol} size="sm" className="text-muted-foreground" />
                      <div>
                        <div className="font-medium">{coin.name}</div>
                        <div className="text-xs text-muted-foreground uppercase">{coin.symbol}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatUSD(coin.price)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={badgeVariant} className="gap-1" aria-label="24h change">
                      {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {formatPercent(coin.change24h)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatCompactUSD(coin.volume24h)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatCompactUSD(coin.marketCap)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile stacked view */}
      <div className="md:hidden space-y-3">
        {data.map((coin) => {
          const isPositive = coin.change24h > 0;
          const badgeVariant = isPositive ? 'success' : 'destructive';
          return (
            <div key={coin.id} className="border rounded-lg p-4 space-y-2 hover:bg-muted/10 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TokenIcon symbol={coin.symbol} size="sm" className="text-muted-foreground" />
                  <div>
                    <div className="font-medium">{coin.name}</div>
                    <div className="text-xs text-muted-foreground uppercase">{coin.symbol}</div>
                  </div>
                </div>
                <Badge variant={badgeVariant} className="gap-1" aria-label="24h change">
                  {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {formatPercent(coin.change24h)}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Price</dt>
                  <dd className="font-medium">{formatUSD(coin.price)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Volume 24h</dt>
                  <dd className="font-medium">{formatCompactUSD(coin.volume24h)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Market Cap</dt>
                  <dd className="font-medium">{formatCompactUSD(coin.marketCap)}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </>
  );
}
