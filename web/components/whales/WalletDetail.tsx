'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatUSD, formatPercent } from '@/lib/format';
import { TrendingUp, TrendingDown, Radio, Copy, ExternalLink } from 'lucide-react';
import type { TrackedWallet, WalletTransaction, WhaleSignal } from '@/lib/whales/types';
import { useState } from 'react';

type Props = {
  wallet: TrackedWallet & { positions: TrackedWallet['positions'] };
  transactions: WalletTransaction[];
  signals: WhaleSignal[];
};

export function WalletDetail({ wallet, transactions, signals }: Props) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isProfit = wallet.totalProfitUsd > 0;
  const totalPositionsValue = wallet.positions.reduce(
    (sum, p) => sum + p.balanceUsd,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Radio className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{wallet.label}</h1>
            <Badge variant="outline">{wallet.category}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <code className="text-xs">{wallet.address}</code>
            <button
              onClick={copyAddress}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Copy address"
            >
              <Copy className="h-3 w-3" />
            </button>
            {copied && <span className="text-xs text-green-500">Copied!</span>}
            <a
              href={`https://etherscan.io/address/${wallet.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
            <div className="flex items-center gap-2">
              {isProfit ? (
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span
                className={`text-2xl font-bold ${
                  isProfit ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatUSD(wallet.totalProfitUsd)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
            <div className="text-2xl font-bold">{formatPercent(wallet.winRate / 100)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Trades</div>
            <div className="text-2xl font-bold">{wallet.totalTrades}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Portfolio Value</div>
            <div className="text-2xl font-bold">{formatUSD(totalPositionsValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <PositionsTable positions={wallet.positions} />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsTable transactions={transactions} />
        </TabsContent>

        <TabsContent value="signals" className="space-y-4">
          <SignalsList signals={signals} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PositionsTable({ positions }: { positions: TrackedWallet['positions'] }) {
  if (positions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No active positions.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {positions.map((position, idx) => {
            const isProfit = position.pnl > 0;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex-1">
                  <div className="font-medium">{position.token.symbol}</div>
                  <div className="text-xs text-muted-foreground">
                    {position.token.name}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-medium">{formatUSD(position.balanceUsd)}</div>
                  <div className="flex items-center justify-end gap-1 text-xs">
                    {isProfit ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={isProfit ? 'text-emerald-400' : 'text-red-400'}>
                      {formatUSD(position.pnl)} ({formatPercent(position.pnlPercent / 100)})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionsTable({ transactions }: { transactions: WalletTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No transactions found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {transactions.slice(0, 20).map((tx) => {
            const isBuy = tx.type === 'buy';
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant={isBuy ? 'success' : 'destructive'}>
                    {isBuy ? 'BUY' : 'SELL'}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{tx.token.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatUSD(tx.amountUsd)}</div>
                  <a
                    href={`https://etherscan.io/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 justify-end"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SignalsList({ signals }: { signals: WhaleSignal[] }) {
  if (signals.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No signals generated yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Signals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {signals.map((signal) => {
            const severityColors = {
              critical: 'border-orange-500/30 bg-orange-500/5',
              high: 'border-red-500/30 bg-red-500/5',
              medium: 'border-yellow-500/30 bg-yellow-500/5',
              low: 'border-blue-500/30 bg-blue-500/5',
            };

            return (
              <div
                key={signal.id}
                className={`p-4 rounded-lg border ${severityColors[signal.severity]}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{signal.signalType.replace('_', ' ')}</Badge>
                    <Badge variant="outline" className={severityColors[signal.severity]}>
                      {signal.severity}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {signal.confidence}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{signal.reasoning}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {signal.transaction.token.symbol} • {formatUSD(signal.transaction.amountUsd)}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(signal.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

