'use client';

import { formatUSD } from '@/lib/format';
import { useEffect, useState } from 'react';

type Props = {
  price: number;
  coinId: string;
};

export function LivePriceCell({ price, coinId }: Props) {
  const [displayPrice, setDisplayPrice] = useState(price);
  const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (price !== displayPrice) {
      if (price > displayPrice) {
        setPriceChange('up');
      } else if (price < displayPrice) {
        setPriceChange('down');
      }
      
      setDisplayPrice(price);
      
      // Reset animation after 1 second
      const timer = setTimeout(() => setPriceChange(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [price, displayPrice]);

  return (
    <span
      className={`font-medium transition-colors ${
        priceChange === 'up'
          ? 'text-emerald-400 animate-pulse'
          : priceChange === 'down'
            ? 'text-red-400 animate-pulse'
            : ''
      }`}
    >
      {formatUSD(displayPrice)}
    </span>
  );
}

