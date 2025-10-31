// Signal generation engine with AI scoring
import type { WhaleSignal, TrackedWallet, WalletTransaction, SignalFilters } from './types';
import { getWalletTransactions, getWalletPositions } from './tracker';

// Calculate confidence score based on multiple factors
function calculateConfidence(
  wallet: TrackedWallet,
  transaction: WalletTransaction,
  signalType: WhaleSignal['signalType']
): number {
  let score = 50; // Base score

  // Wallet performance factors (40% weight)
  const winRateScore = wallet.winRate * 0.4;
  const profitScore = Math.min(Math.log10(Math.abs(wallet.totalProfitUsd) + 1) * 10, 20);
  score += winRateScore + profitScore;

  // Transaction size factor (30% weight)
  if (transaction.amountUsd > 1000000) score += 20; // Whale size
  else if (transaction.amountUsd > 100000) score += 15; // Large
  else if (transaction.amountUsd > 50000) score += 10; // Medium
  else score += 5; // Small

  // Signal type factor (20% weight)
  switch (signalType) {
    case 'large_buy':
      score += 15;
      break;
    case 'multiple_buys':
      score += 18;
      break;
    case 'new_position':
      score += 12;
      break;
    case 'large_sell':
      score += 10;
      break;
    case 'position_closed':
      score += 8;
      break;
  }

  // Wallet category factor (10% weight)
  if (wallet.category === 'smart-money') score += 10;
  else if (wallet.category === 'whale') score += 8;
  else if (wallet.category === 'defi') score += 5;

  return Math.min(Math.floor(score), 100);
}

// Generate reasoning for signal
function generateReasoning(
  wallet: TrackedWallet,
  transaction: WalletTransaction,
  signalType: WhaleSignal['signalType']
): string {
  const parts: string[] = [];

  if (wallet.winRate > 70) {
    parts.push(`High win rate (${wallet.winRate.toFixed(0)}%)`);
  }
  if (wallet.totalProfitUsd > 1000000) {
    parts.push(`Profitable wallet (+$${(wallet.totalProfitUsd / 1000000).toFixed(1)}M)`);
  }
  if (transaction.amountUsd > 500000) {
    parts.push(`Large transaction ($${(transaction.amountUsd / 1000).toFixed(0)}K)`);
  }

  switch (signalType) {
    case 'large_buy':
      parts.push('Significant buy signal');
      break;
    case 'multiple_buys':
      parts.push('Multiple consecutive buys');
      break;
    case 'new_position':
      parts.push('Entering new position');
      break;
  }

  return parts.join(' • ') || 'Wallet activity detected';
}

// Determine signal severity
function determineSeverity(
  confidence: number,
  amountUsd: number,
  signalType: WhaleSignal['signalType']
): WhaleSignal['severity'] {
  if (confidence >= 80 && amountUsd > 500000) return 'critical';
  if (confidence >= 70 || amountUsd > 1000000) return 'high';
  if (confidence >= 60 || amountUsd > 100000) return 'medium';
  return 'low';
}

// Detect signal type from transaction
function detectSignalType(
  transaction: WalletTransaction,
  previousTransactions: WalletTransaction[]
): WhaleSignal['signalType'] {
  if (transaction.type === 'sell' && transaction.amountUsd > 100000) {
    return 'large_sell';
  }

  if (transaction.type === 'buy') {
    if (transaction.amountUsd > 500000) {
      return 'large_buy';
    }

    // Check for multiple recent buys
    const recentBuys = previousTransactions
      .slice(0, 10)
      .filter((tx) => tx.type === 'buy' && tx.token.symbol === transaction.token.symbol);
    
    if (recentBuys.length >= 3) {
      return 'multiple_buys';
    }

    // Check if this is a new position
    const hasPreviousPosition = previousTransactions.some(
      (tx) => tx.token.address === transaction.token.address && tx.type === 'buy'
    );
    
    if (!hasPreviousPosition) {
      return 'new_position';
    }

    return 'large_buy';
  }

  return 'large_buy';
}

export async function generateSignals(
  wallets: TrackedWallet[],
  filters?: SignalFilters
): Promise<WhaleSignal[]> {
  try {
    const signals: WhaleSignal[] = [];

    for (const wallet of wallets) {
      // Apply filters
      if (filters?.wallets && !filters.wallets.includes(wallet.address)) continue;

      // Get recent transactions
      const transactions = await getWalletTransactions(wallet.address, 20);
      
      if (transactions.length === 0) continue;

      // Analyze each transaction for signals
      for (const transaction of transactions) {
        // Apply token filter
        if (filters?.tokens && !filters.tokens.includes(transaction.token.symbol)) continue;

        // Apply amount filter
        if (filters?.minAmountUsd && transaction.amountUsd < filters.minAmountUsd) continue;

        // Detect signal type
        const signalType = detectSignalType(transaction, transactions);

        // Apply signal type filter
        if (filters?.signalTypes && !filters.signalTypes.includes(signalType)) continue;

        // Calculate confidence
        const confidence = calculateConfidence(wallet, transaction, signalType);

        // Apply confidence filter
        if (filters?.minConfidence && confidence < filters.minConfidence) continue;

        // Determine severity
        const severity = determineSeverity(confidence, transaction.amountUsd, signalType);

        // Apply severity filter
        if (filters?.severity && !filters.severity.includes(severity)) continue;

        // Generate reasoning
        const reasoning = generateReasoning(wallet, transaction, signalType);

        signals.push({
          id: `${wallet.address}-${transaction.id}`,
          wallet,
          transaction,
          signalType,
          confidence,
          reasoning,
          timestamp: transaction.timestamp,
          severity,
        });
      }
    }

    // Sort by confidence and timestamp
    return signals.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.timestamp - a.timestamp;
    });
  } catch (error) {
    console.error('Failed to generate signals:', error);
    return [];
  }
}

export async function getSignalsForWallet(
  address: string,
  limit: number = 10
): Promise<WhaleSignal[]> {
  const { getTrackedWallets } = await import('./tracker');
  const wallets = await getTrackedWallets();
  const wallet = wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());

  if (!wallet) return [];

  return generateSignals([wallet]).then((signals) => signals.slice(0, limit));
}

