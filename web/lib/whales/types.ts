// Core types for Whale Signal Hub

export type WalletAddress = string;

export type Token = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chain: 'ethereum' | 'bsc' | 'arbitrum' | 'polygon' | 'solana';
};

export type WalletPosition = {
  token: Token;
  balance: string; // Raw balance as string
  balanceUsd: number;
  avgBuyPrice: number;
  currentPrice: number;
  pnl: number; // Profit/Loss in USD
  pnlPercent: number;
};

export type WalletTransaction = {
  id: string;
  txHash: string;
  timestamp: number;
  type: 'buy' | 'sell' | 'transfer';
  token: Token;
  amount: string; // Raw amount
  amountUsd: number;
  fromAddress: WalletAddress;
  toAddress: WalletAddress;
  price?: number; // Price at transaction time
};

export type TrackedWallet = {
  address: WalletAddress;
  label: string;
  tags: string[];
  totalProfitUsd: number;
  winRate: number;
  totalTrades: number;
  followers: number;
  firstTracked: number;
  lastActivity: number;
  positions: WalletPosition[];
  category: 'whale' | 'smart-money' | 'degen' | 'defi' | 'nft';
};

export type WhaleSignal = {
  id: string;
  wallet: TrackedWallet;
  transaction: WalletTransaction;
  signalType: 'large_buy' | 'large_sell' | 'new_position' | 'position_closed' | 'multiple_buys';
  confidence: number; // 0-100 AI score
  reasoning: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
};

export type SignalFilters = {
  wallets?: WalletAddress[];
  tokens?: string[];
  minAmountUsd?: number;
  minConfidence?: number;
  signalTypes?: WhaleSignal['signalType'][];
  severity?: WhaleSignal['severity'][];
};

