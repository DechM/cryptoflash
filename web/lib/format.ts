export function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatCompactUSD(n: number): string {
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
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}
