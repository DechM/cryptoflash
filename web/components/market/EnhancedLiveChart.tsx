'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';
import { formatUSD } from '@/lib/format';
import Image from 'next/image';

type ChartDataPoint = {
  time: number;
  value: number;
};

type ChartType = 'price' | 'market_cap';
type TimeRange = '24h' | '7d' | '30d' | '1y' | 'all';

type Props = {
  data: ChartDataPoint[];
  marketCapData?: ChartDataPoint[];
  currentPrice: number;
  currentMarketCap?: number;
  coinSymbol: string;
  coinName: string;
  chartType: ChartType;
  timeRange: TimeRange;
};

export function EnhancedLiveChart({
  data,
  marketCapData,
  currentPrice,
  currentMarketCap,
  coinSymbol,
  coinName,
  chartType,
  timeRange,
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    date: string;
    time: string;
    price: number;
    visible: boolean;
  } | null>(null);

  // Main initialization effect
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const activeData = chartType === 'market_cap' && marketCapData ? marketCapData : data;

    // Filter valid data
    const validData = activeData.filter(
      (d) =>
        d &&
        typeof d.time === 'number' &&
        typeof d.value === 'number' &&
        !isNaN(d.value) &&
        d.value > 0
    );

    if (validData.length === 0) {
      console.warn('EnhancedLiveChart: No valid data', { dataLength: activeData.length });
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
            secondsVisible: true,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            rightOffset: 12,
            barSpacing: 20,
          },
          rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            entireTextOnly: false,
          },
          crosshair: {
            mode: 1, // Normal mode with crosshair
            vertLine: {
              color: '#6b7280',
              width: 1,
              style: 3, // Dotted
            },
            horzLine: {
              color: '#6b7280',
              width: 1,
              style: 3, // Dotted
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

        // Create series
        const areaSeries = chart.addSeries(AreaSeries, {
          lineColor: lineColor,
          topColor: topColor,
          bottomColor: bottomColor,
          lineWidth: 2,
          priceLineVisible: true,
          lastValueVisible: true,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 6,
        }) as ISeriesApi<'Area'>;

        seriesRef.current = areaSeries;

        // Format and set data
        const formattedData = validData.map((d) => ({
          time: d.time as Time,
          value: d.value,
        }));

        areaSeries.setData(formattedData);
        chart.timeScale().fitContent();

        // Custom tooltip on crosshair move
        chart.subscribeCrosshairMove((param: any) => {
          if (
            param?.point === undefined ||
            !param?.time ||
            !param?.seriesData ||
            param.seriesData.size === 0
          ) {
            setTooltipData(null);
            return;
          }

          const seriesData = param.seriesData.get(areaSeries) as
            | { value: number; time: Time }
            | undefined;

          if (!seriesData || typeof seriesData.value !== 'number') {
            setTooltipData(null);
            return;
          }

          try {
            const timestamp =
              typeof param.time === 'number'
                ? param.time * 1000
                : new Date(param.time as any).getTime();
            const date = new Date(timestamp);

            if (isNaN(date.getTime())) {
              setTooltipData(null);
              return;
            }

            const dateStr = date.toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
            });
            const timeStr = date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            });

            setTooltipData({
              date: dateStr,
              time: timeStr,
              price: seriesData.value,
              visible: true,
            });
          } catch (error) {
            setTooltipData(null);
          }
        });

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
  }, [data, marketCapData, chartType]);

  // Update chart with live price
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    const currentValue = chartType === 'market_cap' && currentMarketCap 
      ? currentMarketCap 
      : currentPrice;

    if (!currentValue || isNaN(currentValue)) return;

    setIsUpdating(true);

    try {
      const now = Math.floor(Date.now() / 1000);
      seriesRef.current.update({
        time: now as Time,
        value: currentValue,
      });
      chartRef.current.timeScale().scrollToPosition(-1, false);
    } catch (error) {
      console.error('Error updating chart:', error);
    }

    setTimeout(() => setIsUpdating(false), 300);
  }, [currentPrice, currentMarketCap, chartType]);

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
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50 shadow-lg">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </div>
      )}

      {/* Custom Tooltip - positioned at top center like CoinMarketCap */}
      {tooltipData && tooltipData.visible && (
        <div
          ref={tooltipRef}
          className="absolute z-30 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-xl pointer-events-none"
          style={{
            left: '50%',
            top: '16px',
            transform: 'translateX(-50%)',
            minWidth: '200px',
          }}
        >
          <div className="flex flex-col gap-1 text-xs">
            <div className="text-muted-foreground font-medium">{tooltipData.date}</div>
            <div className="text-muted-foreground">{tooltipData.time}</div>
            <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-border/50">
              <div className={`h-2 w-2 rounded-full ${chartType === 'market_cap' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
              <span className="font-semibold text-foreground">
                {chartType === 'market_cap' ? 'Market Cap' : 'Price'}: {formatUSD(tooltipData.price)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CryptoFlash Watermark - bottom right like CoinMarketCap */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-background/60 backdrop-blur-sm px-2.5 py-1 rounded border border-border/20 pointer-events-none">
        <Image
          src="/branding/cryptoflash-logo.png"
          alt="CryptoFlash"
          width={16}
          height={16}
          className="opacity-60"
          unoptimized
        />
        <span className="text-xs font-medium text-muted-foreground/80">CryptoFlash</span>
      </div>

      <div
        ref={chartContainerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ minHeight: '600px', height: '600px', width: '100%' }}
      />
    </div>
  );
}

