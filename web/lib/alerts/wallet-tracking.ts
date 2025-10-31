// Wallet-to-wallet transfer tracking with real transaction data
import type { CryptoFlashAlert } from './types';

export type WalletTransferStats = {
  fromAddress: string;
  toAddress: string;
  totalTransfers: number;
  totalAmountUsd: number;
  lastTransferTime: number;
  blockchain: string;
  tokens: Record<string, { count: number; totalUsd: number }>; // token -> stats
};

/**
 * Track wallet-to-wallet transfers from alerts
 * This aggregates real transaction data to show money flow between wallets
 */
export function trackWalletTransfers(alerts: CryptoFlashAlert[]): Map<string, WalletTransferStats> {
  const transferMap = new Map<string, WalletTransferStats>();

  for (const alert of alerts) {
    // Skip if addresses are missing
    if (!alert.from?.address || !alert.to?.[0]?.address) continue;

    const fromAddress = alert.from.address.toLowerCase();
    const toAddress = alert.to[0].address.toLowerCase();
    
    // Create unique key for wallet pair
    const key = `${alert.blockchain}:${fromAddress}->${toAddress}`;

    const existing = transferMap.get(key);

    if (existing) {
      // Update existing transfer stats
      existing.totalTransfers += 1;
      existing.totalAmountUsd += alert.token.amountUsd;
      existing.lastTransferTime = Math.max(existing.lastTransferTime, alert.timestamp);
      
      // Track token transfers
      const tokenSymbol = alert.token.symbol;
      if (existing.tokens[tokenSymbol]) {
        existing.tokens[tokenSymbol].count += 1;
        existing.tokens[tokenSymbol].totalUsd += alert.token.amountUsd;
      } else {
        existing.tokens[tokenSymbol] = {
          count: 1,
          totalUsd: alert.token.amountUsd,
        };
      }
    } else {
      // Create new transfer tracking entry
      transferMap.set(key, {
        fromAddress,
        toAddress,
        totalTransfers: 1,
        totalAmountUsd: alert.token.amountUsd,
        lastTransferTime: alert.timestamp,
        blockchain: alert.blockchain,
        tokens: {
          [alert.token.symbol]: {
            count: 1,
            totalUsd: alert.token.amountUsd,
          },
        },
      });
    }
  }

  return transferMap;
}

/**
 * Get top wallet-to-wallet transfer pairs by volume
 */
export function getTopWalletPairs(
  transferMap: Map<string, WalletTransferStats>,
  limit: number = 10
): WalletTransferStats[] {
  return Array.from(transferMap.values())
    .sort((a, b) => b.totalAmountUsd - a.totalAmountUsd)
    .slice(0, limit);
}

/**
 * Get all transfers for a specific wallet (as sender or receiver)
 */
export function getWalletTransfers(
  transferMap: Map<string, WalletTransferStats>,
  walletAddress: string
): {
  asSender: WalletTransferStats[];
  asReceiver: WalletTransferStats[];
  totalSentUsd: number;
  totalReceivedUsd: number;
} {
  const address = walletAddress.toLowerCase();
  const asSender: WalletTransferStats[] = [];
  const asReceiver: WalletTransferStats[] = [];
  let totalSentUsd = 0;
  let totalReceivedUsd = 0;

  for (const transfer of transferMap.values()) {
    if (transfer.fromAddress === address) {
      asSender.push(transfer);
      totalSentUsd += transfer.totalAmountUsd;
    }
    if (transfer.toAddress === address) {
      asReceiver.push(transfer);
      totalReceivedUsd += transfer.totalAmountUsd;
    }
  }

  return {
    asSender: asSender.sort((a, b) => b.totalAmountUsd - a.totalAmountUsd),
    asReceiver: asReceiver.sort((a, b) => b.totalAmountUsd - a.totalAmountUsd),
    totalSentUsd,
    totalReceivedUsd,
  };
}

