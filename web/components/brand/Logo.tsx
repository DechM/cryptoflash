import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  withText?: boolean;
};

export function Logo({ className, withText = true }: LogoProps) {
  return (
    <Link href="/" aria-label="CryptoFlash Home" className={cn('inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm', className)}>
      <Image
        src="/branding/cryptoflash-logo.png"
        alt="CryptoFlash"
        width={32}
        height={32}
        className="h-6 w-6 sm:h-6 sm:w-6 md:h-8 md:w-8"
        priority
      />
      {withText && (
        <span className="hidden md:inline-block font-semibold tracking-tight text-foreground">
          CryptoFlash
        </span>
      )}
    </Link>
  );
}
