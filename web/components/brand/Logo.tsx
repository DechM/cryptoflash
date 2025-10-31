import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  withText?: boolean;
  className?: string;
  imgSize?: number; // px
};

export default function Logo({ withText = true, className = "", imgSize = 28 }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="CryptoFlash Home"
      className={`flex items-center gap-2 hover:opacity-90 transition-opacity ${className}`}
    >
      <Image
        src="/branding/cryptoflash-logo.png"
        alt="CryptoFlash"
        width={imgSize}
        height={imgSize}
        className="h-7 w-auto sm:h-8"
        priority
      />
      {withText && (
        <span className="hidden sm:inline-block font-semibold tracking-tight">
          Crypto<span className="text-primary">Flash</span>
        </span>
      )}
    </Link>
  );
}
