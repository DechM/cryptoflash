import { cn } from '@/lib/utils';
import { getTokenIcon } from './token-map';

type TokenIconProps = {
  symbol: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function TokenIcon({ symbol, className, size = 'md' }: TokenIconProps) {
  const icon = getTokenIcon(symbol);
  const hasCustomIcon = icon !== '●';

  const sizeClasses = {
    sm: 'h-4 w-4 text-sm',
    md: 'h-5 w-5 text-base',
    lg: 'h-6 w-6 text-lg',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-semibold',
        sizeClasses[size],
        !hasCustomIcon && 'rounded-full bg-muted/50 px-1',
        className
      )}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}
