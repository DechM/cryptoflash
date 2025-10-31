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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current || isInitialized) return;

    // Only initialize if we have valid data
    const validData = data.filter(
      (d) =>
        d &&
        typeof d.time === 'number' &&
        typeof d.value === 'number' &&
        !isNaN(d.value) &&
        d.value > 0
    );

    if (validData.length === 0) {
      console.warn('LiveChart: No valid data to display');
      return;
    }

    const container = chartContainerRef.current;
    const containerWidth = container.clientWidth || 1200;

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
        width: containerWidth,
        height: 600, // Increased height like CoinMarketCap
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          fixLeftEdge: false,
          fixRightEdge: false,
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          entireTextOnly: false,
        },
        crosshair: {
          mode: 0, // Normal mode
          vertLine: {
            color: '#6b7280',
            width: 1,
            style: 0, // Solid
          },
          horzLine: {
            color: '#6b7280',
            width: 1,
            style: 0, // Solid
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          axisDoubleClickReset: true,
          mouseWheel: true,
          pinch: true,
        },
      });

      chartRef.current = chart;

      // Determine if trend is positive or negative
      const firstPrice = validData[0]?.value || 0;
      const lastPrice = validData[validData.length - 1]?.value || 0;
      const isPositive = lastPrice >= firstPrice;

      // Use green for positive, red for negative (like CoinMarketCap)
      const lineColor = isPositive ? '#22c55e' : '#ef4444';
      const topColor = isPositive
        ? 'rgba(34, 197, 94, 0.2)'
        : 'rgba(239, 68, 68, 0.2)';
      const bottomColor = isPositive
        ? 'rgba(34, 197, 94, 0.01)'
        : 'rgba(239, 68, 68, 0.01)';

      const areaSeries = (chart as any).addAreaSeries({
        lineColor: lineColor,
        topColor: topColor,
        bottomColor: bottomColor,
        lineWidth: 2.5,
        priceLineVisible: true,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
      }) as ISeriesApi<'Area'>;

      seriesRef.current = areaSeries;

      // Format data for lightweight-charts
      const formattedData = validData.map((d) => ({
        time: d.time as Time,
        value: d.value,
      }));

      if (formattedData.length > 0) {
        areaSeries.setData(formattedData);
        chart.timeScale().fitContent();
        setIsInitialized(true);
      }

      const handleResize = () => {
        if (container && chart) {
          const newWidth = container.clientWidth || 1200;
          chart.applyOptions({ width: newWidth });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) {
          chart.remove();
        }
        setIsInitialized(false);
      };
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }, [data, isInitialized]);

  // Update chart with new price
  useEffect(() => {
    if (
      !seriesRef.current ||
      !chartRef.current ||
      !isInitialized ||
      data.length === 0 ||
      !currentPrice ||
      isNaN(currentPrice)
    )
      return;

    setIsUpdating(true);

    const validData = data.filter(
      (d) => d && typeof d.value === 'number' && !isNaN(d.value) && d.value > 0
    );

    if (validData.length === 0) return;

    try {
      const lastDataPoint = validData[validData.length - 1];
      const now = Math.floor(Date.now() / 1000);

      // Update the latest point with current price
      seriesRef.current.update({
        time: (lastDataPoint.time === now
          ? lastDataPoint.time
          : now) as Time,
        value: currentPrice,
      });

      // Auto-scroll to show the latest point
      chartRef.current.timeScale().scrollToPosition(-1, false);
    } catch (error) {
      console.error('Error updating chart:', error);
    }

    setTimeout(() => setIsUpdating(false), 300);
  }, [currentPrice, data, isInitialized]);

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
        style={{ minHeight: '600px', height: '600px' }}
      />
    </div>
  );
}

