'use client';

import { useEffect, useState, useMemo } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TokenIcon from '@/components/icons/TokenIcon';
import { formatCompactUSD, formatTimeAgo } from '@/lib/format';
import { ExternalLink, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MoneyFlow, RadarPosition } from '@/lib/pulse/radar';
import { calculateRadarPositions } from '@/lib/pulse/radar';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function MoneyFlowRadar() {
  const [chain, setChain] = useState<'ethereum' | 'bsc' | 'arbitrum' | 'polygon'>('ethereum');
  const [minUsd, setMinUsd] = useState(10000);

  const { data: flows, error } = useSWR<MoneyFlow[]>(
    `/api/pulse/radar?chain=${chain}&minUsd=${minUsd}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const radarPositions = useMemo(() => {
    if (!flows) return [];
    return calculateRadarPositions(flows);
  }, [flows]);

  if (error) {
    return (
      <Alert variant="default">
        <AlertDescription>Radar data temporarily unavailable.</AlertDescription>
      </Alert>
    );
  }

  if (!flows || flows.length === 0) {
    return (
      <Alert variant="default">
        <AlertDescription>No money flows detected.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Chain:</label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value as any)}
            className="px-3 py-1 rounded-md border bg-background text-sm"
          >
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="polygon">Polygon</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Min Size:</label>
          <select
            value={minUsd}
            onChange={(e) => setMinUsd(parseInt(e.target.value, 10))}
            className="px-3 py-1 rounded-md border bg-background text-sm"
          >
            <option value="10000">$10k+</option>
            <option value="100000">$100k+</option>
            <option value="1000000">$1M+</option>
          </select>
        </div>
      </div>

      {/* Radar Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Money Flow Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-[500px] border rounded-lg bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
            {/* Radar grid */}
            <svg className="absolute inset-0 w-full h-full">
              {/* Circles */}
              {[1, 2, 3, 4, 5].map((i) => (
                <circle
                  key={i}
                  cx="50%"
                  cy="50%"
                  r={`${i * 15}%`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-muted/20"
                />
              ))}
              {/* Crosshairs */}
              <line
                x1="50%"
                y1="0"
                x2="50%"
                y2="100%"
                stroke="currentColor"
                strokeWidth="1"
                className="text-muted/20"
              />
              <line
                x1="0"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke="currentColor"
                strokeWidth="1"
                className="text-muted/20"
              />
            </svg>

            {/* Token positions */}
            {radarPositions.map((position) => (
              <div
                key={position.token}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
              >
                <div className="relative group">
                  {/* Pulsing dot */}
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 border-background transition-all',
                      position.pulse > 70
                        ? 'bg-red-500 animate-pulse'
                        : position.pulse > 50
                          ? 'bg-orange-500'
                          : 'bg-green-500',
                      'shadow-lg'
                    )}
                    style={{
                      boxShadow: `0 0 ${position.pulse / 5}px currentColor`,
                    }}
                  />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <Card className="p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <TokenIcon symbol={position.token} size={16} />
                        <span className="font-medium">{position.token}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {position.flow.length} flows
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flow list */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Recent Flows</h3>
        {flows.slice(0, 20).map((flow) => (
          <Card key={flow.id} className="hover:bg-muted/10 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <TokenIcon symbol={flow.token.symbol} size={24} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{flow.token.symbol}</span>
                      <Badge
                        variant={
                          flow.category === 'whale'
                            ? 'destructive'
                            : flow.category === 'shark'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {flow.category.toUpperCase()}
                      </Badge>
                      <Badge
                        variant={flow.type === 'buy' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {flow.type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(flow.timestamp)} • {flow.chain}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold">{formatCompactUSD(flow.amountUsd)}</div>
                  <div className="text-xs text-muted-foreground">
                    Intensity: {flow.radarIntensity}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
