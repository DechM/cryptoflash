'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiveChart } from './LiveChart';
import { CoinStats } from './CoinStats';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';

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

export function CoinDetail({ coinId }: Props) {
  const { data, error, isLoading } = useSWR<CoinData>(
    `/api/market/${coinId}`,
    fetcher,
    {
      refreshInterval: 10000, // Update every 10 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

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

      {/* Live Chart */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{data.name} Price Chart (7 Days)</span>
            <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              Live
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.chart_data && data.chart_data.length > 0 ? (
            <LiveChart
              data={data.chart_data}
              currentPrice={data.current_price}
              coinSymbol={data.symbol}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Chart data unavailable
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

