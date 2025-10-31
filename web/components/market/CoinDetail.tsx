'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedLiveChart } from './EnhancedLiveChart';
import { ChartFilters } from './ChartFilters';
import { CoinStats } from './CoinStats';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { useLiveCryptoPrice } from '@/hooks/useLiveCryptoPrice';
import { useState, useMemo } from 'react';

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
  description: string;
  homepage: string;
  blockchain_site: string[];
  chart_data: Array<{ time: number; value: number }>;
  last_updated: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Props = {
  coinId: string;
};

type ChartType = 'price' | 'market_cap';
type TimeRange = '24h' | '7d' | '30d' | '1y' | 'all';

export function CoinDetail({ coinId }: Props) {
  const [chartType, setChartType] = useState<ChartType>('price');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const { data, error, isLoading } = useSWR<CoinData>(
    `/api/market/${coinId}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Fetch chart data based on filters
  const { data: chartDataResponse } = useSWR<{
    data: Array<{ time: number; value: number }>;
    range: TimeRange;
    type: ChartType;
  }>(
    data ? `/api/market/${coinId}/chart?range=${timeRange}&type=${chartType}` : null,
    fetcher,
    {
      refreshInterval: timeRange === 'all' ? 3600000 : 60000, // 1 hour for 'all', 1 min for others
      revalidateOnFocus: true,
    }
  );

  // Get live price from WebSocket
  const { price: livePrice } = useLiveCryptoPrice({
    coinId,
    fallbackPrice: data?.current_price,
    fallbackChange24h: data?.price_change_percentage_24h,
  });

  // Filter data based on time range
  const filteredChartData = useMemo(() => {
    if (!chartDataResponse?.data) return data?.chart_data || [];
    
    const now = Date.now();
    let cutoffTime = now;

    switch (timeRange) {
      case '24h':
        cutoffTime = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case '1y':
        cutoffTime = now - 365 * 24 * 60 * 60 * 1000;
        break;
      case 'all':
        return chartDataResponse.data;
    }

    return chartDataResponse.data.filter(
      (point) => point.time * 1000 >= cutoffTime
    );
  }, [chartDataResponse, timeRange, data?.chart_data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading coin data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Failed to load coin data</p>
        <p className="text-muted-foreground text-sm">
          Please check the coin ID and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CoinStats data={data} />

      {/* Enhanced Live Chart with Filters */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>
              {data.name} {chartType === 'market_cap' ? 'Market Cap' : 'Price'} Chart
            </span>
            <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              Live
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartFilters
            chartType={chartType}
            timeRange={timeRange}
            onChartTypeChange={setChartType}
            onTimeRangeChange={setTimeRange}
          />
          {filteredChartData && filteredChartData.length > 0 ? (
            <EnhancedLiveChart
              data={filteredChartData}
              marketCapData={chartType === 'market_cap' ? filteredChartData : undefined}
              currentPrice={livePrice || data.current_price}
              currentMarketCap={data.market_cap}
              coinSymbol={data.symbol}
              coinName={data.name}
              chartType={chartType}
              timeRange={timeRange}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading chart data...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {data.description && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>About {data.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: data.description }}
            />
          </CardContent>
        </Card>
      )}

      {/* Links */}
      {(data.homepage || (data.blockchain_site && data.blockchain_site.length > 0)) && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {data.homepage && (
                <a
                  href={data.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  Website
                </a>
              )}
              {data.blockchain_site?.slice(0, 3).map((site, idx) => (
                <a
                  key={idx}
                  href={site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  Explorer {idx + 1}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

