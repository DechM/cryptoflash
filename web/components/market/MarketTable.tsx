'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { formatUSD, formatPercent, formatCompactUSD } from '@/lib/format';
import { SparklineChart } from './SparklineChart';
import { LivePriceCell } from './LivePriceCell';
import { ArrowUp, ArrowDown, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { MarketCoin } from '@/lib/market';
import Link from 'next/link';
import Image from 'next/image';

type Props = {
  data: MarketCoin[];
};

type SortField = 'market_cap' | 'price' | 'change_24h' | 'change_7d' | 'volume';
type SortDirection = 'asc' | 'desc';

export function MarketTable({ data }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('market_cap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Track previous prices to show price change animation
  const [previousPrices, setPreviousPrices] = useState<Map<string, number>>(new Map());
  
  // Update previous prices when data changes
  React.useEffect(() => {
    const newPrices = new Map<string, number>();
    data.forEach((coin) => {
      newPrices.set(coin.id, coin.current_price);
    });
    setPreviousPrices(newPrices);
  }, [data]);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (coin) =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query) ||
          coin.id.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortField) {
        case 'market_cap':
          aVal = a.market_cap || 0;
          bVal = b.market_cap || 0;
          break;
        case 'price':
          aVal = a.current_price || 0;
          bVal = b.current_price || 0;
          break;
        case 'change_24h':
          aVal = a.price_change_percentage_24h || 0;
          bVal = b.price_change_percentage_24h || 0;
          break;
        case 'change_7d':
          aVal = a.price_change_percentage_7d || 0;
          bVal = b.price_change_percentage_7d || 0;
          break;
        case 'volume':
          aVal = a.total_volume || 0;
          bVal = b.total_volume || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aVal - bVal;
      }
      return bVal - aVal;
    });

    return filtered;
  }, [data, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name, symbol, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background/50 backdrop-blur border-border/50"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-border/50 glass-card">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Coin
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center justify-end gap-1">
                  Price
                  {sortField === 'price' && (
                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('change_24h')}
              >
                <div className="flex items-center justify-end gap-1">
                  24h
                  {sortField === 'change_24h' && (
                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('change_7d')}
              >
                <div className="flex items-center justify-end gap-1">
                  7d
                  {sortField === 'change_7d' && (
                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('market_cap')}
              >
                <div className="flex items-center justify-end gap-1">
                  Market Cap
                  {sortField === 'market_cap' && (
                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('volume')}
              >
                <div className="flex items-center justify-end gap-1">
                  Volume (24h)
                  {sortField === 'volume' && (
                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Last 7 Days
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filteredData.map((coin) => (
              <MarketTableRow key={coin.id} coin={coin} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredData.map((coin) => (
          <MarketCard key={coin.id} coin={coin} />
        ))}
      </div>
    </div>
  );
}

function MarketTableRow({ coin }: { coin: MarketCoin }) {
  const isPositive24h = coin.price_change_percentage_24h >= 0;
  const isPositive7d = coin.price_change_percentage_7d >= 0;

  return (
    <tr className="market-table-row hover:bg-primary/5 transition-colors group">
      <td className="px-4 py-4 text-sm text-muted-foreground">
        {coin.market_cap_rank || '-'}
      </td>
      <td className="px-4 py-4">
        <Link href={`/market/${coin.id}`} className="flex items-center gap-3 group-hover:text-primary transition-colors">
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src={coin.image}
              alt={coin.name}
              width={32}
              height={32}
              className="rounded-full"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm">{coin.name}</div>
            <div className="text-xs text-muted-foreground uppercase">{coin.symbol}</div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-4 text-right">
        <LivePriceCell price={coin.current_price} coinId={coin.id} />
      </td>
      <td className="px-4 py-4 text-right">
        <span
          className={`flex items-center justify-end gap-1 font-medium ${
            isPositive24h ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {isPositive24h ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {formatPercent(coin.price_change_percentage_24h / 100)}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <span
          className={`flex items-center justify-end gap-1 font-medium ${
            isPositive7d ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {isPositive7d ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {formatPercent((coin.price_change_percentage_7d ?? 0) / 100)}
        </span>
      </td>
      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
        {formatCompactUSD(coin.market_cap)}
      </td>
      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
        {formatCompactUSD(coin.total_volume)}
      </td>
      <td className="px-4 py-4">
        <div className="h-10 w-24 ml-auto">
          {coin.sparkline_in_7d?.price ? (
            <SparklineChart
              data={coin.sparkline_in_7d.price}
              isPositive={coin.price_change_percentage_7d >= 0}
            />
          ) : (
            <div className="text-xs text-muted-foreground">No data</div>
          )}
        </div>
      </td>
    </tr>
  );
}

function MarketCard({ coin }: { coin: MarketCoin }) {
  const isPositive24h = coin.price_change_percentage_24h >= 0;
  const isPositive7d = coin.price_change_percentage_7d >= 0;

  return (
    <Link href={`/market/${coin.id}`}>
      <div className="p-4 rounded-lg border border-border/50 glass-card hover:bg-primary/5 hover:border-primary/30 hover-scale transition-all animate-fade-in">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative h-10 w-10 shrink-0">
              <Image
                src={coin.image}
                alt={coin.name}
                width={40}
                height={40}
                className="rounded-full"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="font-semibold truncate">{coin.name}</div>
                <div className="text-xs text-muted-foreground uppercase shrink-0">
                  {coin.symbol}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Rank #{coin.market_cap_rank || '-'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Price</div>
            <div className="font-semibold">{formatUSD(coin.current_price)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">24h Change</div>
            <span
              className={`flex items-center gap-1 font-semibold ${
                isPositive24h ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isPositive24h ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {formatPercent((coin.price_change_percentage_24h ?? 0) / 100)}
            </span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
            <div className="font-medium text-sm">{formatCompactUSD(coin.market_cap)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Volume 24h</div>
            <div className="font-medium text-sm">{formatCompactUSD(coin.total_volume)}</div>
          </div>
        </div>

        {coin.sparkline_in_7d?.price && (
          <div className="h-12 w-full">
            <SparklineChart
              data={coin.sparkline_in_7d.price}
              isPositive={isPositive7d}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

