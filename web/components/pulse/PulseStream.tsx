'use client';

import { useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TokenIcon from '@/components/icons/TokenIcon';
import { formatCompactUSD, formatTimeAgo } from '@/lib/format';
import { ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { PulseTrade } from '@/lib/pulse/stream';
import { getPulseWebSocket } from '@/lib/pulse/websocket';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function PulseStream() {
  const { data: initialTrades, error } = useSWR<PulseTrade[]>(
    '/api/pulse/stream',
    fetcher,
    { refreshInterval: 30000 }
  );

  const [trades, setTrades] = useState<PulseTrade[]>(initialTrades || []);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update trades when SWR data changes
  useEffect(() => {
    if (initialTrades) {
      setTrades((prev) => {
        // Merge new trades, avoid duplicates
        const existingIds = new Set(prev.map((t) => t.id));
        const newTrades = initialTrades.filter((t) => !existingIds.has(t.id));
        return [...newTrades, ...prev].slice(0, 100); // Keep latest 100
      });
    }
  }, [initialTrades]);

  // Real-time WebSocket updates
  useEffect(() => {
    const ws = getPulseWebSocket();
    const unsubscribe = ws.subscribe((trade) => {
      if (!isPaused) {
        setTrades((prev) => [trade, ...prev].slice(0, 100));
        
        // Auto-scroll to top for new trade
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      }
    });

    return unsubscribe;
  }, [isPaused]);

  const getPulseColor = (pulse: number) => {
    if (pulse >= 80) return 'bg-red-500';
    if (pulse >= 60) return 'bg-orange-500';
    if (pulse >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPulseIntensity = (pulse: number) => {
    return `opacity-${Math.min(Math.floor(pulse / 10) * 10, 90)}`;
  };

  if (error) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Pulse stream temporarily unavailable. Retrying...
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Waiting for pulse activity...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Live Pulse Stream</h2>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={cn(
            'px-3 py-1 rounded-md text-sm border transition-colors',
            isPaused
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary text-primary-foreground border-primary'
          )}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <div
        ref={containerRef}
        className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {trades.map((trade, index) => (
          <Card
            key={trade.id}
            className={cn(
              'transition-all duration-500 hover:shadow-lg hover:border-primary/50',
              'animate-in slide-in-from-right',
              `delay-${Math.min(index * 50, 500)}`
            )}
            style={{
              animationDelay: `${Math.min(index * 50, 500)}ms`,
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Pulse indicator */}
                  <div className="relative">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full',
                        getPulseColor(trade.pulse),
                        'animate-pulse'
                      )}
                      style={{
                        opacity: trade.pulse / 100,
                        boxShadow: `0 0 ${trade.pulse / 5}px ${getPulseColor(trade.pulse)}`,
                      }}
                    />
                  </div>

                  <TokenIcon symbol={trade.tokenSymbol} size={24} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{trade.tokenSymbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {trade.tokenName}
                      </span>
                      {trade.type === 'buy' ? (
                        <ArrowUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-400" />
                      )}
                      <Badge
                        variant={trade.type === 'buy' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {trade.type.toUpperCase()}
                      </Badge>
                      {trade.isUnusual && (
                        <Badge variant="destructive" className="text-xs animate-pulse">
                          UNUSUAL
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{formatTimeAgo(trade.timestamp)}</span>
                      <span>•</span>
                      <span>{trade.dex}</span>
                      <span>•</span>
                      <span>Pulse: {trade.pulse}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-lg">
                    {formatCompactUSD(trade.amountUsd)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(trade.timestamp)}
                  </div>
                </div>
              </div>

              {/* Pulse bar */}
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-500', getPulseColor(trade.pulse))}
                  style={{ width: `${trade.pulse}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
