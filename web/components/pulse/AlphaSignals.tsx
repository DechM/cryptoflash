'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TokenIcon from '@/components/icons/TokenIcon';
import { formatCompactUSD, formatTimeAgo } from '@/lib/format';
import { ArrowUp, ArrowDown, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlphaSignal, AlphaWallet } from '@/lib/pulse/alpha';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AlphaSignals() {
  const [activeTab, setActiveTab] = useState<'signals' | 'wallets'>('signals');

  const { data: signals } = useSWR<AlphaSignal[]>(
    '/api/pulse/alpha',
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: wallets } = useSWR<AlphaWallet[]>(
    '/api/pulse/alpha?type=wallets',
    fetcher,
    { refreshInterval: 60000 }
  );

  const getStrengthColor = (strength: AlphaWallet['signalStrength']) => {
    switch (strength) {
      case 'very-strong':
        return 'bg-red-500';
      case 'strong':
        return 'bg-orange-500';
      case 'moderate':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-red-400';
    if (confidence >= 60) return 'text-orange-400';
    if (confidence >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
      <TabsList>
        <TabsTrigger value="signals">Alpha Signals</TabsTrigger>
        <TabsTrigger value="wallets">Top Wallets</TabsTrigger>
      </TabsList>

      <TabsContent value="signals" className="mt-6">
        {!signals || signals.length === 0 ? (
          <Alert variant="default">
            <AlertDescription>No alpha signals detected.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {signals.map((signal) => (
              <Card
                key={signal.id}
                className="hover:bg-muted/10 transition-all hover:border-primary/50"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Wallet info */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-semibold">{signal.wallet.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {signal.wallet.alphaScore} Alpha
                          </Badge>
                          <Badge
                            variant={
                              signal.wallet.signalStrength === 'very-strong'
                                ? 'destructive'
                                : signal.wallet.signalStrength === 'strong'
                                  ? 'default'
                                  : 'secondary'
                            }
                            className="text-xs"
                          >
                            {signal.wallet.signalStrength.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span>{signal.wallet.winRate}% Win Rate</span>
                          <span>•</span>
                          <span>{formatCompactUSD(signal.wallet.totalProfitUsd)} Profit</span>
                          <span>•</span>
                          <span>{signal.wallet.following} Followers</span>
                        </div>

                        {/* Signal details */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <TokenIcon symbol={signal.token.symbol} size={24} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{signal.token.symbol}</span>
                              {signal.type === 'buy' ? (
                                <ArrowUp className="h-4 w-4 text-green-400" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-red-400" />
                              )}
                              <Badge
                                variant={signal.type === 'buy' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {signal.type.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatCompactUSD(signal.amountUsd)} • {formatTimeAgo(signal.timestamp)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={cn(
                                'text-2xl font-bold',
                                getConfidenceColor(signal.confidence)
                              )}
                            >
                              {signal.confidence}%
                            </div>
                            <div className="text-xs text-muted-foreground">Confidence</div>
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-muted-foreground italic">
                          {signal.reasoning}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="wallets" className="mt-6">
        {!wallets || wallets.length === 0 ? (
          <Alert variant="default">
            <AlertDescription>No wallet data available.</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.map((wallet) => (
              <Card key={wallet.address} className="hover:bg-muted/10 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{wallet.label}</CardTitle>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </div>
                    </div>
                    <Badge
                      className={cn('text-xs', getStrengthColor(wallet.signalStrength))}
                    >
                      {wallet.alphaScore}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Win Rate</div>
                      <div className="font-semibold">{wallet.winRate}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Profit</div>
                      <div className="font-semibold">{formatCompactUSD(wallet.totalProfitUsd)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Trades</div>
                      <div className="font-semibold">{wallet.totalTrades}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Followers</div>
                      <div className="font-semibold flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {wallet.following}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {wallet.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground mt-3">
                    Last activity: {formatTimeAgo(wallet.lastActivity)}
                  </div>

                  <button className="w-full mt-3 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    Follow Wallet
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
