'use client';

import { useParams } from 'next/navigation';
import { WalletDetail } from '@/components/whales/WalletDetail';
import useSWR from 'swr';
import type { TrackedWallet } from '@/lib/whales/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function WalletDetailPage() {
  const params = useParams();
  const addressParam = typeof params?.address === 'string' 
    ? params.address 
    : Array.isArray(params?.address) 
    ? params.address[0] 
    : null;

  const address = addressParam ? decodeURIComponent(addressParam) : null;

  const { data: walletData, error, isLoading } = useSWR<TrackedWallet & { transactions: any[]; signals: any[] }>(
    address ? `/api/wallet/${encodeURIComponent(address)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  if (!address) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Invalid Wallet Address</h1>
          <p className="text-muted-foreground">Please provide a valid wallet address.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Wallet Not Found</h1>
          <p className="text-muted-foreground">
            {error?.error || 'Failed to load wallet data. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !walletData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4" />
          <div className="h-6 bg-muted rounded w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { transactions, signals, ...wallet } = walletData;

  return (
    <WalletDetail
      wallet={{ ...wallet, positions: wallet.positions || [] }}
      transactions={transactions || []}
      signals={signals || []}
    />
  );
}

