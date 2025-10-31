'use client';

import { useEffect, useState, useRef } from 'react';
import { getBinanceWebSocket, type BinancePriceUpdate } from '@/lib/realtime/binance-ws';
import useSWR from 'swr';

type Props = {
  coinId: string; // CoinGecko ID
  fallbackPrice?: number;
  fallbackChange24h?: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLiveCryptoPrice({ coinId, fallbackPrice, fallbackChange24h }: Props) {
  const [livePrice, setLivePrice] = useState<BinancePriceUpdate | null>(null);
  const unsubRef = useRef<() => void>();
  const wsRef = useRef<ReturnType<typeof getBinanceWebSocket>>();

  // Fallback to CoinGecko API polling if WebSocket fails or coin not on Binance
  const { data: coingeckoData } = useSWR(
    !livePrice && fallbackPrice
      ? `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
      : null,
    fetcher,
    {
      refreshInterval: 30000, // Poll every 30s as fallback
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    const ws = getBinanceWebSocket();
    wsRef.current = ws;

    unsubRef.current = ws.subscribe(coinId, (update) => {
      setLivePrice(update);
    });

    return () => {
      unsubRef.current?.();
    };
  }, [coinId]);

  // Get price from WebSocket or fallback
  const price =
    livePrice?.price ?? coingeckoData?.[coinId]?.usd ?? fallbackPrice ?? 0;
  
  const change24h =
    livePrice?.change24h ??
    (coingeckoData?.[coinId]?.usd_24h_change
      ? coingeckoData[coinId].usd_24h_change / 100
      : fallbackChange24h ?? 0);

  const hasWebSocket = !!livePrice;

  return {
    price,
    change24h,
    hasWebSocket,
    volume24h: livePrice?.volume24h,
  };
}

