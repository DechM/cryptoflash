import { cn } from '@/lib/utils';

type TokenIconProps = {
  symbol: string;
  className?: string;
};

export function TokenIcon({ symbol, className }: TokenIconProps) {
  const iconMap: Record<string, string> = {
    BTC: '₿',
    ETH: 'Ξ',
  };

  const icon = iconMap[symbol.toUpperCase()] || '●';

  return (
    <span className={cn('inline-flex items-center justify-center text-lg font-semibold', className)} aria-hidden="true">
      {icon}
    </span>
  );
}
