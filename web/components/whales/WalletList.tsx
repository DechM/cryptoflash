'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUSD, formatPercent } from '@/lib/format';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Radio, ExternalLink } from 'lucide-react';
import type { TrackedWallet } from '@/lib/whales/types';

type Props = {
  wallets: TrackedWallet[];
};

export function WalletList({ wallets }: Props) {
  if (wallets.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No wallets tracked yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Wallet
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total P&L
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Trades
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Followers
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {wallets.map((wallet) => (
                <WalletRow key={wallet.address} wallet={wallet} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {wallets.map((wallet) => (
          <WalletCard key={wallet.address} wallet={wallet} />
        ))}
      </div>
    </div>
  );
}

function WalletRow({ wallet }: { wallet: TrackedWallet }) {
  const isProfit = wallet.totalProfitUsd > 0;

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-4">
        <Link
          href={`/wallet/${wallet.address}`}
          className="flex items-center gap-2 group"
        >
          <Radio className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="min-w-0">
            <div className="font-medium truncate">{wallet.label}</div>
            <div className="text-xs text-muted-foreground font-mono truncate">
              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-4">
        <Badge variant="outline">{wallet.category}</Badge>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {isProfit ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={isProfit ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}
          >
            {formatUSD(wallet.totalProfitUsd)}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <span className="font-medium">{formatPercent(wallet.winRate / 100)}</span>
      </td>
      <td className="px-4 py-4 text-right">
        <span className="text-muted-foreground">{wallet.totalTrades}</span>
      </td>
      <td className="px-4 py-4 text-right">
        <span className="text-muted-foreground">{wallet.followers}</span>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="inline-flex items-center gap-1">
          <div
            className={`h-2 w-2 rounded-full ${
              wallet.lastActivity > Date.now() - 60 * 60 * 1000
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-muted-foreground'
            }`}
          />
        </div>
      </td>
    </tr>
  );
}

function WalletCard({ wallet }: { wallet: TrackedWallet }) {
  const isProfit = wallet.totalProfitUsd > 0;

  return (
    <Link href={`/wallet/${wallet.address}`}>
      <Card className="hover:border-primary/50 transition-all">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Radio className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium truncate">{wallet.label}</h3>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
              </p>
            </div>
            <Badge variant="outline">{wallet.category}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
              <div className="flex items-center gap-1">
                {isProfit ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={
                    isProfit ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'
                  }
                >
                  {formatUSD(wallet.totalProfitUsd)}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
              <div className="font-medium">{formatPercent(wallet.winRate / 100)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Trades</div>
              <div className="font-medium">{wallet.totalTrades}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Followers</div>
              <div className="font-medium">{wallet.followers}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

