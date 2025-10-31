export function formatUSD(n: number): string {
  if (typeof n !== 'number' || isNaN(n) || !isFinite(n) || n === 0) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatCompactUSD(n: number): string {
  if (typeof n !== 'number' || isNaN(n) || !isFinite(n) || n === 0) {
    return '$0.00';
  }
  if (n >= 1e9) {
    return `$${(n / 1e9).toFixed(1)}B`;
  }
  if (n >= 1e6) {
    return `$${(n / 1e6).toFixed(1)}M`;
  }
  if (n >= 1e3) {
    return `$${(n / 1e3).toFixed(1)}K`;
  }
  return formatUSD(n);
}

export function formatPercent(n: number): string {
  if (typeof n !== 'number' || isNaN(n) || !isFinite(n)) {
    return 'N/A';
  }
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function formatTimeAgo(timestamp: Date | number | string): string {
  const now = Date.now();
  let then: number;
  if (typeof timestamp === 'string') {
    then = new Date(timestamp).getTime();
  } else if (typeof timestamp === 'number') {
    then = timestamp;
  } else {
    then = timestamp.getTime();
  }
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return 'over a week ago';
}

export function formatDecimal(price: number): string {
  return (price * 100).toFixed(1) + '%';
}
