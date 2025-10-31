import { NextResponse } from 'next/server';
import { getTrackedWallets, getWalletTransactions, getWalletPositions } from '@/lib/whales/tracker';
import { getSignalsForWallet } from '@/lib/whales/signals';
import type { TrackedWallet } from '@/lib/whales/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: addressParam } = await params;
    
    if (!addressParam || typeof addressParam !== 'string') {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Decode address in case it was URL encoded
    const address = decodeURIComponent(addressParam);
    
    // Fetch all wallets
    const wallets = await getTrackedWallets();
    
    // Try to find wallet by address (case-insensitive)
    let wallet = wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());

    // Fallback: If not found exactly, try without 0x prefix or with different case
    if (!wallet) {
      const normalizedAddress = address.toLowerCase().startsWith('0x') 
        ? address.toLowerCase() 
        : `0x${address.toLowerCase()}`;
      
      wallet = wallets.find((w) => 
        w.address.toLowerCase() === normalizedAddress ||
        w.address.toLowerCase() === address.toLowerCase() ||
        w.address.toLowerCase().replace('0x', '') === address.toLowerCase().replace('0x', '')
      );
    }

    if (!wallet) {
      console.warn(`[Wallet Detail] Wallet not found for address: ${address}, total wallets: ${wallets.length}`);
      return NextResponse.json(
        { error: 'Wallet not found', address, totalWallets: wallets.length },
        { status: 404 }
      );
    }

    // Fetch wallet data in parallel
    const [transactions, positions, signals] = await Promise.all([
      getWalletTransactions(address, 50),
      getWalletPositions(address),
      getSignalsForWallet(address, 20),
    ]);

    // Combine wallet data
    const walletData: TrackedWallet & { transactions: any[]; signals: any[] } = {
      ...wallet,
      positions,
      transactions,
      signals,
    };

    return NextResponse.json(walletData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Wallet detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet details' },
      { status: 500 }
    );
  }
}

