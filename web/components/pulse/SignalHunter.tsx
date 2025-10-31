'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TokenIcon from '@/components/icons/TokenIcon';
import { formatUSD, formatPercent, formatCompactUSD } from '@/lib/format';
import { Search, Filter, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { HunterFilter, HunterResult } from '@/lib/pulse/hunter';

export function SignalHunter() {
  const [filters, setFilters] = useState<HunterFilter>({});
  const [results, setResults] = useState<HunterResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/pulse/hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const updateFilter = (key: keyof HunterFilter, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Signal Hunter
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/20">
              <div>
                <Label>Min Volume (USD)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minVolume || ''}
                  onChange={(e) => updateFilter('minVolume', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label>Max Volume (USD)</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={filters.maxVolume || ''}
                  onChange={(e) => updateFilter('maxVolume', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label>Min 24h Change (%)</Label>
                <Input
                  type="number"
                  placeholder="-100"
                  value={filters.minChange24h || ''}
                  onChange={(e) => updateFilter('minChange24h', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label>Max 24h Change (%)</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={filters.maxChange24h || ''}
                  onChange={(e) => updateFilter('maxChange24h', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label>Min Market Cap (USD)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minMarketCap || ''}
                  onChange={(e) => updateFilter('minMarketCap', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label>Max Market Cap (USD)</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={filters.maxMarketCap || ''}
                  onChange={(e) => updateFilter('maxMarketCap', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label>Min Pulse Score</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={filters.minPulse || ''}
                  onChange={(e) => updateFilter('minPulse', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasWhaleActivity || false}
                    onChange={(e) => updateFilter('hasWhaleActivity', e.target.checked || undefined)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Has Whale Activity</span>
                </label>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasSmartMoney || false}
                    onChange={(e) => updateFilter('hasSmartMoney', e.target.checked || undefined)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Has Smart Money</span>
                </label>
              </div>
            </div>
          )}

          <Button onClick={handleSearch} disabled={isSearching} className="w-full">
            {isSearching ? 'Hunting...' : 'Hunt Signals'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Found {results.length} Signals</h2>
            <Badge variant="outline">Sorted by Score</Badge>
          </div>

          <div className="grid gap-4">
            {results.map((result) => (
              <Card
                key={result.token.id}
                className="hover:bg-muted/10 transition-all hover:border-primary/50"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <TokenIcon symbol={result.token.symbol} size={32} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Link
                            href={`/asset/${result.token.id}`}
                            className="font-semibold text-lg hover:text-primary transition-colors"
                          >
                            {result.token.name}
                          </Link>
                          <span className="text-muted-foreground">({result.token.symbol})</span>
                          <Badge
                            variant={result.score >= 80 ? 'destructive' : result.score >= 60 ? 'default' : 'secondary'}
                          >
                            Score: {result.score}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Price</div>
                            <div className="font-semibold">{formatUSD(result.price)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">24h Change</div>
                            <div
                              className={cn(
                                'font-semibold',
                                result.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                              )}
                            >
                              {formatPercent(result.change24h)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Volume 24h</div>
                            <div className="font-semibold">{formatCompactUSD(result.volume24h)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Market Cap</div>
                            <div className="font-semibold">{formatCompactUSD(result.marketCap)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Pulse:</span>
                          <Badge variant="outline">{result.pulse}</Badge>
                          {result.whaleActivity && (
                            <Badge variant="destructive" className="text-xs">
                              Whale Activity
                            </Badge>
                          )}
                          {result.smartMoney && (
                            <Badge variant="default" className="text-xs">
                              Smart Money
                            </Badge>
                          )}
                          {result.signals.map((signal) => (
                            <Badge key={signal} variant="secondary" className="text-xs">
                              {signal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : results.length === 0 && !isSearching ? (
        <Alert variant="default">
          <AlertDescription>
            No signals found. Adjust your filters and try again.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
