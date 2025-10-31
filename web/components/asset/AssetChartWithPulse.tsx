'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import type { OHLCData } from '@/lib/asset';
import { getMoneyFlows } from '@/lib/pulse/radar';
import { cn } from '@/lib/utils';

type Props = {
  data: OHLCData[];
  livePrice?: number;
  tokenSymbol?: string;
};

type WhaleMarker = {
  time: number;
  type: 'buy' | 'sell';
  amountUsd: number;
  intensity: number;
};

export function AssetChartWithPulse({ data, livePrice, tokenSymbol }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [whaleMarkers, setWhaleMarkers] = useState<WhaleMarker[]>([]);
  const markersRef = useRef<any[]>([]);

  // Fetch whale flows for this token
  useEffect(() => {
    if (!tokenSymbol) return;

    getMoneyFlows('ethereum', 50000).then((flows) => {
      const tokenFlows = flows.filter(
        (flow) => flow.token.symbol.toLowerCase() === tokenSymbol.toLowerCase()
      );

      const markers: WhaleMarker[] = tokenFlows
        .filter((flow) => flow.type === 'buy' || flow.type === 'sell') // Only buy/sell, no transfers
        .slice(0, 10) // Limit to 10 markers
        .map((flow) => ({
          time: Math.floor(flow.timestamp / 1000),
          type: flow.type as 'buy' | 'sell',
          amountUsd: flow.amountUsd,
          intensity: flow.radarIntensity,
        }));

      setWhaleMarkers(markers);
    });
  }, [tokenSymbol]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = (chart as any).addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    }) as ISeriesApi<'Candlestick'>;

    seriesRef.current = candlestickSeries;

    const formattedData = data.map((d) => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(formattedData as any);
    chart.timeScale().fitContent();

    // Add whale markers
    const markers = whaleMarkers.map((marker) => ({
      time: marker.time as any,
      position: 'aboveBar' as const,
      color: marker.type === 'buy' ? '#22c55e' : '#ef4444',
      shape: marker.type === 'buy' ? 'arrowUp' as const : 'arrowDown' as const,
      size: Math.min(Math.floor(marker.intensity / 10) + 1, 3),
      text: marker.type === 'buy' ? '🐋' : '🐋',
    }));

    if (markers.length > 0) {
      candlestickSeries.setMarkers(markers as any);
      markersRef.current = markers;
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, whaleMarkers]);

  // Update with live price
  useEffect(() => {
    if (livePrice && seriesRef.current && data.length > 0) {
      const lastCandle = data[data.length - 1];
      const now = Math.floor(Date.now() / 1000);

      seriesRef.current.update({
        time: (lastCandle.time === now ? lastCandle.time : now) as any,
        open: lastCandle.close,
        high: Math.max(lastCandle.high, livePrice),
        low: Math.min(lastCandle.low, livePrice),
        close: livePrice,
      } as any);
    }
  }, [livePrice, data]);

  return (
    <div className="w-full relative">
      <div ref={chartContainerRef} className="w-full" />
      {whaleMarkers.length > 0 && (
        <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          🐋 {whaleMarkers.length} whale markers
        </div>
      )}
    </div>
  );
}
