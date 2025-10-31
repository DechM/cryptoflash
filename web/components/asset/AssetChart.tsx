'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import type { OHLCData } from '@/lib/asset';

type Props = {
  data: OHLCData[];
  livePrice?: number;
};

export function AssetChart({ data, livePrice }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

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

    // Type assertion needed due to lightweight-charts type definitions
    const candlestickSeries = (chart as any).addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    }) as ISeriesApi<'Candlestick'>;

    seriesRef.current = candlestickSeries;

    // Format data for lightweight-charts: time must be in seconds as UTCTimestamp
    const formattedData = data.map((d) => ({
      time: d.time as any, // Cast to Time type (can be number or UTCTimestamp)
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(formattedData as any);

    chart.timeScale().fitContent();

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
  }, [data]);

  // Update with live price if available
  useEffect(() => {
    if (livePrice && seriesRef.current && data.length > 0) {
      const lastCandle = data[data.length - 1];
      const now = Math.floor(Date.now() / 1000);
      
      // Update last candle or add new one
      seriesRef.current.update({
        time: lastCandle.time === now ? lastCandle.time : now,
        open: lastCandle.close,
        high: Math.max(lastCandle.high, livePrice),
        low: Math.min(lastCandle.low, livePrice),
        close: livePrice,
      });
    }
  }, [livePrice, data]);

  return <div ref={chartContainerRef} className="w-full" />;
}
