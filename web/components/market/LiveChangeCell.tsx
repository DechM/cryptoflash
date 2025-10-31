'use client';

import { formatPercent } from '@/lib/format';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useLiveCryptoPrice } from '@/hooks/useLiveCryptoPrice';

type Props = {
  change24h?: number | null;
  coinId: string;
};

export function LiveChangeCell({ change24h: initialChange24h, coinId }: Props) {
  const { change24h: liveChange24h, hasWebSocket } = useLiveCryptoPrice({
    coinId,
    fallbackChange24h: initialChange24h ?? undefined,
  });

  const change24h = liveChange24h ?? (initialChange24h ?? 0);
  const isPositive = change24h >= 0;

  return (
    <span
      className={`flex items-center justify-end gap-1 font-medium ${
        isPositive ? 'text-emerald-400' : 'text-red-400'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {formatPercent(change24h)}
      {hasWebSocket && (
        <span className="ml-0.5 inline-flex h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
      )}
    </span>
  );
}

