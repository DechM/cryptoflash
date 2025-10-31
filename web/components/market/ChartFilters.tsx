'use client';

import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp } from 'lucide-react';

type ChartType = 'price' | 'market_cap';
type TimeRange = '24h' | '7d' | '30d' | '1y' | 'all';

type Props = {
  chartType: ChartType;
  timeRange: TimeRange;
  onChartTypeChange: (type: ChartType) => void;
  onTimeRangeChange: (range: TimeRange) => void;
};

export function ChartFilters({
  chartType,
  timeRange,
  onChartTypeChange,
  onTimeRangeChange,
}: Props) {
  return (
    <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
      {/* Chart Type Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={chartType === 'price' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChartTypeChange('price')}
          className="h-8"
        >
          <TrendingUp className="h-3 w-3 mr-1.5" />
          Price
        </Button>
        <Button
          variant={chartType === 'market_cap' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChartTypeChange('market_cap')}
          className="h-8"
        >
          <BarChart3 className="h-3 w-3 mr-1.5" />
          Mkt Cap
        </Button>
      </div>

      {/* Time Range Filters */}
      <div className="flex items-center gap-1">
        {(['24h', '7d', '30d', '1y', 'all'] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTimeRangeChange(range)}
            className="h-8 px-3 text-xs font-medium"
          >
            {range === '7d' ? '1W' : range === '30d' ? '1M' : range === '1y' ? '1Y' : range.toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  );
}

