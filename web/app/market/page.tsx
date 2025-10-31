import type { Metadata } from 'next';
import { MarketPageClient } from '@/components/market/MarketPageClient';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Market — CryptoFlash Hub',
    description: 'Real-time cryptocurrency market data with prices, charts, market cap, and trading volume.',
    alternates: {
      canonical: 'https://cryptoflash.app/market',
    },
  };
}

export default function MarketPage() {
  return <MarketPageClient />;
}
