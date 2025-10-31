'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, type IChartApi, type ISeriesApi, type Time } from 'lightweight-charts';

type ChartDataPoint = {
  time: number;
  value: number;
};

type Props = {
  data: ChartDataPoint[];
  currentPrice: number;
  coinSymbol: string;
};

export function LiveChart({ data, currentPrice, coinSymbol }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Only initialize if we have valid data
    const validData = data.filter((d) => d && typeof d.time === 'number' && typeof d.value === 'number' && !isNaN(d.value));
    if (validData.length === 0) return;

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

    const areaSeries = (chart as any).addAreaSeries({
      lineColor: '#3b82f6',
      topColor: 'rgba(59, 130, 246, 0.3)',
      bottomColor: 'rgba(59, 130, 246, 0.05)',
      lineWidth: 2,
    }) as ISeriesApi<'Area'>;

    seriesRef.current = areaSeries;

    // Format data for lightweight-charts
    const formattedData = validData.map((d) => ({
      time: d.time as Time,
      value: d.value,
    }));

    areaSeries.setData(formattedData);
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

  // Update chart with new price
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || data.length === 0 || !currentPrice || isNaN(currentPrice)) return;

    setIsUpdating(true);
    
    const validData = data.filter((d) => d && typeof d.value === 'number' && !isNaN(d.value));
    if (validData.length === 0) return;

    const lastDataPoint = validData[validData.length - 1];
    const now = Math.floor(Date.now() / 1000);

    // Add or update the latest point
    seriesRef.current.update({
      time: (lastDataPoint.time === now ? lastDataPoint.time : now) as Time,
      value: currentPrice,
    });

    // Auto-scroll to the latest point
    chartRef.current.timeScale().scrollToPosition(-1, false);

    setTimeout(() => setIsUpdating(false), 300);
  }, [currentPrice, data]);

  return (
    <div className="relative">
      {isUpdating && (
        <div className="absolute top-2 right-2 z-10">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      )}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}

