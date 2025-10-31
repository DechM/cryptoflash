import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  withText?: boolean;
  imgSize?: number;
};

export function Logo({ className, withText = true, imgSize = 28 }: LogoProps) {
  return (
    <Link 
      href="/" 
      aria-label="CryptoFlash Home" 
      className={cn("inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm", className)}
    >
      <Image
        src="/branding/cryptoflash-logo.png"
        alt="CryptoFlash"
        width={imgSize}
        height={imgSize}
        className="h-6 w-6 sm:h-6 sm:w-6 md:h-8 md:w-8 flex-shrink-0"
        priority
        unoptimized={false}
      />
      {withText && (
        <span className="hidden md:inline-block font-semibold tracking-tight text-foreground">
          CryptoFlash
        </span>
      )}
    </Link>
  );
}

export default Logo;
