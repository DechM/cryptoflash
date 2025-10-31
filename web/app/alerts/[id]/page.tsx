'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { trackWalletTransfers, getWalletTransfers } from '@/lib/alerts/wallet-tracking';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AlertDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : null;

  const { data: alert, error, isLoading } = useSWR<CryptoFlashAlert>(
    id ? `/api/alerts/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Fetch all alerts to track wallet-to-wallet transfers
  const { data: allAlerts } = useSWR<CryptoFlashAlert[]>(
    '/api/alerts?minAmountUsd=0',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Track wallet transfers
  const walletTransferStats = useMemo(() => {
    if (!allAlerts || !alert?.from?.address || !alert?.to?.[0]?.address) {
      return null;
    }
    
    const transferMap = trackWalletTransfers(allAlerts);
    const fromAddress = alert.from.address.toLowerCase();
    const toAddress = alert.to[0].address.toLowerCase();
    const key = `${alert.blockchain}:${fromAddress}->${toAddress}`;
    
    return transferMap.get(key);
  }, [allAlerts, alert]);

  // Safe access helpers with useMemo - MUST be called before any returns (React hooks rules)
  const safeToken = useMemo(() => {
    // If alert is not loaded yet, return safe default
    if (!alert || !alert.token) {
      return {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
        amount: '0',
        amountUsd: 0,
      };
    }
    
    const token = alert.token;
    
    // If token is missing or invalid, return safe default
    if (!token || typeof token !== 'object') {
      return {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
        amount: '0',
        amountUsd: 0,
      };
    }
    
    // Ensure symbol is always a string (never undefined)
    return {
      symbol: (token.symbol && typeof token.symbol === 'string') ? token.symbol : 'UNKNOWN',
      name: (token.name && typeof token.name === 'string') ? token.name : 'Unknown Token',
      decimals: (typeof token.decimals === 'number') ? token.decimals : 18,
      amount: (token.amount && typeof token.amount === 'string') ? token.amount : '0',
      amountUsd: (typeof token.amountUsd === 'number' && !isNaN(token.amountUsd)) ? token.amountUsd : 0,
    };
  }, [alert?.token]);

  const safeFrom = useMemo(() => {
    if (!alert || !alert.from) {
      return {
        address: '',
        label: 'Unknown Wallet',
        amount: '0',
        amountUsd: 0,
      };
    }
    const from = alert.from;
    if (!from || typeof from !== 'object') {
      return {
        address: '',
        label: 'Unknown Wallet',
        amount: '0',
        amountUsd: 0,
      };
    }
    return {
      address: from.address || '',
      label: from.label || 'Unknown Wallet',
      amount: from.amount || '0',
      amountUsd: from.amountUsd ?? 0,
    };
  }, [alert?.from]);

  const safeTo = useMemo(() => {
    if (!alert || !alert.to) {
      return [{
        address: '',
        label: 'Unknown Wallet',
        amount: '0',
        amountUsd: 0,
      }];
    }
    const to = alert.to;
    if (!Array.isArray(to) || to.length === 0) {
      return [{
        address: '',
        label: 'Unknown Wallet',
        amount: '0',
        amountUsd: 0,
      }];
    }
    return to.map((recipient) => ({
      address: recipient?.address || '',
      label: recipient?.label || 'Unknown Wallet',
      amount: recipient?.amount || '0',
      amountUsd: recipient?.amountUsd ?? 0,
    }));
  }, [alert?.to]);

  // NOW we can do early returns after hooks
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

  // Validate alert has all required fields
  if (!alert || typeof alert !== 'object') {
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

  // Validate txHash before creating explorer URL
  const isValidTxHash = (hash: string | undefined, blockchain: string): boolean => {
    if (!hash) return false;
    if (blockchain === 'bitcoin') {
      // Bitcoin txHash: 64 hex chars
      return /^[a-fA-F0-9]{64}$/.test(hash);
    } else {
      // Ethereum and EVM chains: 0x + 64 hex chars
      return /^0x[a-fA-F0-9]{64}$/.test(hash);
    }
  };

  const getBlockchainExplorerUrl = (blockchain: string, txHash: string | undefined): string => {
    if (!txHash || !isValidTxHash(txHash, blockchain)) {
      return '#'; // Return invalid link if hash is not valid
    }
    
    const explorers: Record<string, string> = {
      ethereum: `https://etherscan.io/tx/${txHash}`,
      bitcoin: `https://blockstream.info/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
      solana: `https://solscan.io/tx/${txHash}`,
      polygon: `https://polygonscan.com/tx/${txHash}`,
      arbitrum: `https://arbiscan.io/tx/${txHash}`,
    };
    
    return explorers[blockchain] || '#';
  };

  const blockchainExplorers: Record<string, string> = {
    ethereum: getBlockchainExplorerUrl('ethereum', alert?.txHash),
    bitcoin: getBlockchainExplorerUrl('bitcoin', alert?.txHash),
    bsc: getBlockchainExplorerUrl('bsc', alert?.txHash),
    solana: getBlockchainExplorerUrl('solana', alert?.txHash),
    polygon: getBlockchainExplorerUrl('polygon', alert?.txHash),
    arbitrum: getBlockchainExplorerUrl('arbitrum', alert?.txHash),
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
                  {getTokenEmoji(safeToken?.symbol || 'BTC') || '🪙'}
                </span>
              <div>
                <CardTitle className="text-3xl mb-2">
                  {formatCompactUSD(safeToken?.amountUsd || 0)} {safeToken?.symbol || 'UNKNOWN'}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={severityColors[alert?.severity || 'low']}
                  >
                    {alert?.severity || 'low'}
                  </Badge>
                  <Badge variant="outline">
                    {alertTypeLabels[alert?.alertType || 'large_transfer']}
                  </Badge>
                  <Badge variant="outline" className="uppercase">
                    {alert?.blockchain || 'ethereum'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {alert?.xPostUrl ? (
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
              ) : alert ? (
                <Button
                  asChild
                  variant="outline"
                  className="gap-2"
                >
                  <a
                    href={generateXShareUrl(alert)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="flex items-center gap-1">
                      <span className="text-lg">
                        {getTokenEmoji(safeToken?.symbol || 'BTC') || '🪙'}
                      </span>
                      Share on X
                    </span>
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Description */}
          <div className="mb-4 pb-4 border-b border-border/50">
            <div className="text-sm text-muted-foreground mb-1">Description</div>
            <p className="text-sm">
              Large transfer of {safeToken?.symbol || 'cryptocurrency'} detected on {(alert?.blockchain || 'ethereum').toUpperCase()}. 
              {alert?.alertType === 'exchange_withdrawal' && ' Funds withdrawn from exchange.'}
              {alert?.alertType === 'exchange_deposit' && ' Funds deposited to exchange.'}
              {alert?.alertType === 'whale_buy' && ' Potential whale accumulation detected.'}
              {alert?.alertType === 'whale_sell' && ' Potential whale distribution detected.'}
              {alert?.alertType === 'large_transfer' && ' Large amount transferred between wallets.'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Token</div>
              <div className="font-semibold">
                {safeToken?.name || 'Unknown'} ({safeToken?.symbol || 'UNKNOWN'})
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Price at TX</div>
              <div className="font-semibold">
                {formatUSD(alert?.cryptoPriceAtTx || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Transaction Fee</div>
              <div className="font-semibold">
                {alert?.fee || '0'} {(alert?.blockchain || 'ethereum') === 'bitcoin' ? 'BTC' : 'ETH'}
                {alert?.feeUsd && ` (${formatUSD(alert.feeUsd)})`}
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
                  {alert?.txHash || 'N/A'}
                </code>
                {alert?.txHash && (
                  <>
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
                        href={blockchainExplorers[alert.blockchain || 'ethereum'] || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Block Number</div>
              <div className="font-mono text-sm">
                {alert?.blockNumber ? alert.blockNumber.toLocaleString() : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Timestamp</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {alert?.timestamp ? new Date(alert.timestamp).toLocaleString() : 'N/A'}
                </span>
                {alert?.timeAgo && (
                  <span className="text-xs text-muted-foreground">
                    ({alert.timeAgo})
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Blockchain</div>
              <div className="uppercase font-semibold">{alert?.blockchain || 'ethereum'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Details */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {alert?.alertType === 'whale_buy' || alert?.alertType === 'exchange_withdrawal' ? (
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
                    {safeFrom?.label || 'Unknown Wallet'}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-muted-foreground truncate flex-1">
                      {safeFrom?.address || 'N/A'}
                    </code>
                    {safeFrom?.address && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => copyToClipboard(safeFrom.address, 'from')}
                      >
                        {copiedField === 'from' ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="font-semibold">
                    {formatCompactUSD(safeFrom?.amountUsd || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Transfer Stats */}
          {walletTransferStats && walletTransferStats.totalTransfers > 1 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
              <div className="text-sm font-semibold mb-2 text-primary">Wallet Transfer History</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Transfers</div>
                  <div className="font-semibold">{walletTransferStats.totalTransfers}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Volume</div>
                  <div className="font-semibold">{formatCompactUSD(walletTransferStats.totalAmountUsd)}</div>
                </div>
              </div>
              {Object.keys(walletTransferStats.tokens).length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="text-xs text-muted-foreground mb-2">By Token:</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(walletTransferStats.tokens).map(([token, stats]) => (
                      <Badge key={token} variant="outline" className="text-xs">
                        {token}: {stats.count} tx ({formatCompactUSD(stats.totalUsd)})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
              {(safeTo || []).map((recipient, index) => (
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
                          {recipient.address || 'N/A'}
                        </code>
                        {recipient.address && (
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
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-muted-foreground">Amount</div>
                      <div className="font-semibold">
                        {formatCompactUSD(recipient?.amountUsd || 0)}
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
      xmlns="http://www.w3.org/2000/svg"
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

