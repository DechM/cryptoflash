'use client';

import { formatUSD } from '@/lib/format';
import { useEffect, useState } from 'react';
import { useLiveCryptoPrice } from '@/hooks/useLiveCryptoPrice';

type Props = {
  price: number;
  coinId: string;
  change24h?: number;
};

export function LivePriceCell({ price: initialPrice, coinId, change24h: initialChange24h }: Props) {
  const { price: livePrice, change24h: liveChange24h, hasWebSocket } = useLiveCryptoPrice({
    coinId,
    fallbackPrice: initialPrice,
    fallbackChange24h: initialChange24h,
  });

  const [displayPrice, setDisplayPrice] = useState(livePrice || initialPrice);
  const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const currentPrice = livePrice || initialPrice;
    if (currentPrice !== displayPrice && currentPrice > 0) {
      if (currentPrice > displayPrice) {
        setPriceChange('up');
      } else if (currentPrice < displayPrice) {
        setPriceChange('down');
      }
      
      setDisplayPrice(currentPrice);
      
      // Reset animation after 1 second
      const timer = setTimeout(() => setPriceChange(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [livePrice, initialPrice, displayPrice]);

  const price = livePrice || initialPrice;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`font-medium transition-colors ${
          priceChange === 'up'
            ? 'text-emerald-400 animate-pulse'
            : priceChange === 'down'
              ? 'text-red-400 animate-pulse'
              : ''
        }`}
      >
        {formatUSD(price)}
      </span>
      {hasWebSocket && (
        <span
          className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"
          aria-label="live"
          title="Live price from Binance WebSocket"
        />
      )}
    </div>
  );
}

