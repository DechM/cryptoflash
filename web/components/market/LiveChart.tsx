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

  // Main initialization effect
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    // Filter valid data
    const validData = data.filter(
      (d) =>
        d &&
        typeof d.time === 'number' &&
        typeof d.value === 'number' &&
        !isNaN(d.value) &&
        d.value > 0
    );

    if (validData.length === 0) {
      console.warn('LiveChart: No valid data', { dataLength: data.length });
      return;
    }

    // Initialize chart
    const initChart = () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }

      const width = container.clientWidth || container.offsetWidth || 1200;
      
      if (width === 0) {
        // Retry after a short delay if width is 0
        setTimeout(initChart, 100);
        return;
      }

      try {
        const chart = createChart(container, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#9ca3af',
            fontSize: 12,
          },
          grid: {
            vertLines: {
              color: 'rgba(255, 255, 255, 0.08)',
              visible: true,
            },
            horzLines: {
              color: 'rgba(255, 255, 255, 0.08)',
              visible: true,
            },
          },
          width: width,
          height: 600,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
          rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
        });

        chartRef.current = chart;

        // Determine trend
        const firstPrice = validData[0]?.value || 0;
        const lastPrice = validData[validData.length - 1]?.value || 0;
        const isPositive = lastPrice >= firstPrice;

        // Colors based on trend
        const lineColor = isPositive ? '#22c55e' : '#ef4444';
        const topColor = isPositive
          ? 'rgba(34, 197, 94, 0.2)'
          : 'rgba(239, 68, 68, 0.2)';
        const bottomColor = isPositive
          ? 'rgba(34, 197, 94, 0.01)'
          : 'rgba(239, 68, 68, 0.01)';

        // Use addAreaSeries with runtime check
        // In lightweight-charts v5, addAreaSeries exists but may not be in types
        const chartAny = chart as any;
        let areaSeries: ISeriesApi<'Area'>;
        
        if (typeof chartAny.addAreaSeries === 'function') {
          areaSeries = chartAny.addAreaSeries({
            lineColor: lineColor,
            topColor: topColor,
            bottomColor: bottomColor,
            lineWidth: 2.5,
            priceLineVisible: true,
            lastValueVisible: true,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 5,
          }) as ISeriesApi<'Area'>;
        } else {
          // Fallback: create area series manually if method doesn't exist
          console.warn('addAreaSeries not found, using addLineSeries as fallback');
          areaSeries = chartAny.addLineSeries({
            color: lineColor,
            lineWidth: 2.5,
            priceLineVisible: true,
            lastValueVisible: true,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 5,
          }) as unknown as ISeriesApi<'Area'>;
        }

        seriesRef.current = areaSeries;

        // Format and set data
        const formattedData = validData.map((d) => ({
          time: d.time as Time,
          value: d.value,
        }));

        areaSeries.setData(formattedData);
        chart.timeScale().fitContent();

        // Handle resize
        const handleResize = () => {
          if (container && chart) {
            const newWidth = container.clientWidth || container.offsetWidth || 1200;
            if (newWidth > 0) {
              chart.applyOptions({ width: newWidth });
            }
          }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          if (chart) {
            chart.remove();
          }
        };
      } catch (error) {
        console.error('Error initializing chart:', error);
      }
    };

    // Use IntersectionObserver to ensure container is visible
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          initChart();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    // Fallback: initialize after a delay if observer doesn't fire
    const timeoutId = setTimeout(() => {
      if (!chartRef.current) {
        initChart();
      }
      observer.disconnect();
    }, 500);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [data]);

  // Update chart with live price
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || !currentPrice || isNaN(currentPrice)) return;

    const validData = data.filter(
      (d) => d && typeof d.value === 'number' && !isNaN(d.value) && d.value > 0
    );

    if (validData.length === 0) return;

    setIsUpdating(true);

    try {
      const lastDataPoint = validData[validData.length - 1];
      const now = Math.floor(Date.now() / 1000);

      seriesRef.current.update({
        time: (lastDataPoint.time === now ? lastDataPoint.time : now) as Time,
        value: currentPrice,
      });

      chartRef.current.timeScale().scrollToPosition(-1, false);
    } catch (error) {
      console.error('Error updating chart:', error);
    }

    setTimeout(() => setIsUpdating(false), 300);
  }, [currentPrice, data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-background/30 rounded-lg border border-border/50">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">Chart data unavailable</div>
          <div className="text-sm text-muted-foreground/70">Loading historical data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {isUpdating && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50 shadow-lg">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </div>
      )}
      <div
        ref={chartContainerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ minHeight: '600px', height: '600px', width: '100%' }}
      />
    </div>
  );
}
