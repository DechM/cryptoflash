'use client';

import { formatCompactUSD } from '@/lib/format';
import { useEffect, useState } from 'react';
import { useLiveCryptoPrice } from '@/hooks/useLiveCryptoPrice';

type Props = {
  marketCap: number; // Initial market cap
  coinId: string;
  circulatingSupply: number; // Needed to calculate live market cap
};

export function LiveMarketCapCell({ 
  marketCap: initialMarketCap, 
  coinId, 
  circulatingSupply 
}: Props) {
  const { price: livePrice, hasWebSocket } = useLiveCryptoPrice({
    coinId,
    fallbackPrice: initialMarketCap / circulatingSupply, // Calculate initial price from market cap
  });

  // Calculate live market cap from live price
  const liveMarketCap = livePrice && circulatingSupply > 0 
    ? livePrice * circulatingSupply 
    : initialMarketCap;

  const [displayMarketCap, setDisplayMarketCap] = useState(liveMarketCap);
  const [marketCapChange, setMarketCapChange] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (liveMarketCap !== displayMarketCap && liveMarketCap > 0) {
      if (liveMarketCap > displayMarketCap) {
        setMarketCapChange('up');
      } else if (liveMarketCap < displayMarketCap) {
        setMarketCapChange('down');
      }
      
      setDisplayMarketCap(liveMarketCap);
      
      // Reset animation after 1 second
      const timer = setTimeout(() => setMarketCapChange(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [liveMarketCap, displayMarketCap]);

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <span
        className={`text-sm transition-colors ${
          marketCapChange === 'up'
            ? 'text-emerald-400 animate-pulse'
            : marketCapChange === 'down'
              ? 'text-red-400 animate-pulse'
              : 'text-muted-foreground'
        }`}
      >
        {formatCompactUSD(liveMarketCap)}
      </span>
      {hasWebSocket && (
        <span
          className="inline-flex h-1 w-1 rounded-full bg-emerald-500 animate-pulse"
          aria-label="live"
          title="Live market cap calculated from live price"
        />
      )}
    </div>
  );
}

