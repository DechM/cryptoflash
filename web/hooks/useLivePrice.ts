'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { getPriceFeed, PriceTick } from '@/lib/realtime/priceFeed';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type CoinGeckoResponse = {
  [key: string]: {
    usd: number;
    usd_24h_change?: number;
  };
};

export function useLivePrice(
  symbol: 'BTCUSDT' | 'ETHUSDT',
  coingeckoId: 'bitcoin' | 'ethereum'
) {
  const [tick, setTick] = useState<PriceTick | undefined>();
  const unsubRef = useRef<(() => void) | undefined>();

  const { data } = useSWR<CoinGeckoResponse>(
    tick
      ? null
      : `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`,
    fetcher,
    { refreshInterval: 15000 }
  );

  useEffect(() => {
    const feed = getPriceFeed();
    unsubRef.current = feed.subscribe(symbol, (t) => setTick(t));

    return () => {
      unsubRef.current?.();
    };
  }, [symbol]);

  const price = tick?.price ?? data?.[coingeckoId]?.usd ?? undefined;
  const change24h =
    typeof data?.[coingeckoId]?.usd_24h_change === 'number'
      ? data[coingeckoId].usd_24h_change
      : undefined;

  return { price, change24h, hasWs: !!tick };
}
