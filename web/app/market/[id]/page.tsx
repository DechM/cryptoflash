import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CoinDetail } from '@/components/market/CoinDetail';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptoflash.app'}/api/market/${id}`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      return {
        title: `${id} — CryptoFlash Hub`,
      };
    }

    const data = await response.json();

    return {
      title: `${data.name} (${data.symbol}) — CryptoFlash Hub`,
      description: `Live price, charts, and market data for ${data.name}. Current price: ${formatUSD(data.current_price)}.`,
      alternates: {
        canonical: `https://cryptoflash.app/market/${id}`,
      },
      openGraph: {
        title: `${data.name} (${data.symbol}) — CryptoFlash Hub`,
        description: `Live price and market data for ${data.name}.`,
        url: `https://cryptoflash.app/market/${id}`,
        images: data.image ? [{ url: data.image }] : undefined,
      },
    };
  } catch (error) {
    return {
      title: `${id} — CryptoFlash Hub`,
    };
  }
}

function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default async function CoinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CoinDetail coinId={id} />;
}

