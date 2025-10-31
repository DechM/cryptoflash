'use client';

import { formatCompactUSD } from '@/lib/format';
import { useEffect, useState } from 'react';
import { useLiveCryptoPrice } from '@/hooks/useLiveCryptoPrice';

type Props = {
  volume: number; // Initial 24h volume
  coinId: string;
};

export function LiveVolumeCell({ volume: initialVolume, coinId }: Props) {
  const { volume24h: liveVolume24h, hasWebSocket } = useLiveCryptoPrice({
    coinId,
    fallbackPrice: 0, // We only need volume, not price
  });

  // Use live volume from WebSocket if available, otherwise use initial
  const currentVolume = liveVolume24h ?? initialVolume;

  const [displayVolume, setDisplayVolume] = useState(currentVolume);
  const [volumeChange, setVolumeChange] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (currentVolume !== displayVolume && currentVolume > 0) {
      if (currentVolume > displayVolume) {
        setVolumeChange('up');
      } else if (currentVolume < displayVolume) {
        setVolumeChange('down');
      }
      
      setDisplayVolume(currentVolume);
      
      // Reset animation after 1 second
      const timer = setTimeout(() => setVolumeChange(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentVolume, displayVolume]);

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <span
        className={`text-sm transition-colors ${
          volumeChange === 'up'
            ? 'text-emerald-400 animate-pulse'
            : volumeChange === 'down'
              ? 'text-red-400 animate-pulse'
              : 'text-muted-foreground'
        }`}
      >
        {formatCompactUSD(currentVolume)}
      </span>
      {hasWebSocket && liveVolume24h && (
        <span
          className="inline-flex h-1 w-1 rounded-full bg-emerald-500 animate-pulse"
          aria-label="live"
          title="Live 24h volume from Binance WebSocket"
        />
      )}
    </div>
  );
}

