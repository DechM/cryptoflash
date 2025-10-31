'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  formatUSD,
  formatCompactUSD,
  formatTimeAgo,
} from '@/lib/format';
import { getTokenEmoji } from '@/lib/alerts/token-emoji';
import type { CryptoFlashAlert } from '@/lib/alerts/types';
import {
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Clock,
  Hash,
  ArrowLeft,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { generateXShareUrl } from '@/lib/alerts/social';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AlertDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: alert, error, isLoading } = useSWR<CryptoFlashAlert>(
    id ? `/api/alerts/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted/30 rounded animate-pulse w-32" />
        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-12 bg-muted/30 rounded animate-pulse" />
              <div className="h-64 bg-muted/30 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !alert) {
    return notFound();
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const severityColors = {
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const alertTypeLabels = {
    large_transfer: 'Large Transfer',
    exchange_transfer: 'Exchange Transfer',
    whale_buy: 'Whale Buy',
    whale_sell: 'Whale Sell',
    token_burn: 'Token Burn',
    exchange_withdrawal: 'Exchange Withdrawal',
    exchange_deposit: 'Exchange Deposit',
    unknown_wallet_activity: 'Unknown Activity',
  };

  const blockchainExplorers: Record<string, string> = {
    ethereum: `https://etherscan.io/tx/${alert.txHash}`,
    bitcoin: `https://blockstream.info/tx/${alert.txHash}`,
    bsc: `https://bscscan.com/tx/${alert.txHash}`,
    solana: `https://solscan.io/tx/${alert.txHash}`,
    polygon: `https://polygonscan.com/tx/${alert.txHash}`,
    arbitrum: `https://arbiscan.io/tx/${alert.txHash}`,
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Command Center
        </Button>
      </Link>

      {/* Alert Summary Card */}
      <Card className="glass-card border-border/50 animate-fade-in">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <span className="text-5xl">
                {alert.token.emoji || getTokenEmoji(alert.token.symbol)}
              </span>
              <div>
                <CardTitle className="text-3xl mb-2">
                  {formatCompactUSD(alert.token.amountUsd)} {alert.token.symbol}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={severityColors[alert.severity]}
                  >
                    {alert.severity}
                  </Badge>
                  <Badge variant="outline">
                    {alertTypeLabels[alert.alertType]}
                  </Badge>
                  <Badge variant="outline" className="uppercase">
                    {alert.blockchain}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {alert.xPostUrl ? (
                <Button
                  asChild
                  variant="outline"
                  className="gap-2"
                >
                  <a
                    href={alert.xPostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on X
                  </a>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="gap-2"
                >
                  <a
                    href={generateXShareUrl(alert)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Share2 className="h-4 w-4" />
                    Share on X
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Token</div>
              <div className="font-semibold">
                {alert.token.name} ({alert.token.symbol})
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Price at TX</div>
              <div className="font-semibold">
                {formatUSD(alert.cryptoPriceAtTx)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Transaction Fee</div>
              <div className="font-semibold">
                {alert.fee} ({alert.feeUsd ? formatUSD(alert.feeUsd) : 'N/A'})
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Transaction Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Transaction Hash</div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-muted/30 px-2 py-1 rounded flex-1 truncate">
                  {alert.txHash}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => copyToClipboard(alert.txHash, 'txHash')}
                >
                  {copiedField === 'txHash' ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  asChild
                >
                  <a
                    href={blockchainExplorers[alert.blockchain] || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Block Number</div>
              <div className="font-mono text-sm">
                {alert.blockNumber?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Timestamp</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({alert.timeAgo})
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Blockchain</div>
              <div className="uppercase font-semibold">{alert.blockchain}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Details */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {alert.alertType === 'whale_buy' || alert.alertType === 'exchange_withdrawal' ? (
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-400" />
            )}
            Transfer Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* From */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">From</div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold mb-1">
                    {alert.from.label || 'Unknown Wallet'}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-muted-foreground truncate flex-1">
                      {alert.from.address}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => copyToClipboard(alert.from.address, 'from')}
                    >
                      {copiedField === 'from' ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="font-semibold">
                    {formatCompactUSD(alert.from.amountUsd)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-px w-12 bg-border" />
              <ArrowDown className="h-4 w-4" />
              <div className="h-px w-12 bg-border" />
            </div>
          </div>

          {/* To */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">To</div>
            <div className="space-y-3">
              {alert.to.map((recipient, index) => (
                <div
                  key={index}
                  className="bg-muted/30 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold mb-1">
                        {recipient.label || 'Unknown Wallet'}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-muted-foreground truncate flex-1">
                          {recipient.address}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => copyToClipboard(recipient.address, `to-${index}`)}
                        >
                          {copiedField === `to-${index}` ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-muted-foreground">Amount</div>
                      <div className="font-semibold">
                        {formatCompactUSD(recipient.amountUsd)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ArrowDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 14l-7 7m0 0l-7-7m7 7V3"
      />
    </svg>
  );
}

