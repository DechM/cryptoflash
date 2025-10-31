'use client';

import { useState } from 'react';
import Image from "next/image";

type Props = {
  symbol: string;
  size?: number;
  className?: string;
  imageUrl?: string;
};

// Local fallback icons (if you add them to /public/tokens/)
const KNOWN_ICONS: Record<string, string> = {
  BTC: "/tokens/btc.svg",
  ETH: "/tokens/eth.svg",
  USDT: "/tokens/usdt.svg",
  USDC: "/tokens/usdc.svg",
  DAI: "/tokens/dai.svg",
  PAXG: "/tokens/paxg.svg",
  XAUT: "/tokens/xaut.svg",
};

export function TokenIcon({ symbol, size = 20, className = "", imageUrl }: Props) {
  const [imageError, setImageError] = useState(false);
  const sym = (symbol || "").toUpperCase();

  // Priority: 1) CoinGecko image URL, 2) Local fallback
  const src = imageUrl || KNOWN_ICONS[sym];

  // If image failed to load or no src, show initials
  if (!src || imageError) {
    const initials = sym.length <= 3 ? sym : sym.slice(0, 2);
    const fontSize = initials.length > 2 ? Math.max(8, size * 0.35) : Math.max(9, size * 0.4);
    
    return (
      <span
        aria-label={`${sym} icon`}
        className={`inline-flex items-center justify-center rounded-full bg-muted/40 font-medium text-muted-foreground flex-shrink-0 ${className}`}
        style={{ 
          width: size, 
          height: size,
          fontSize: `${fontSize}px`,
          lineHeight: 1,
        }}
      >
        {initials}
      </span>
    );
  }

  // Check if it's an external URL (CoinGecko) or local
  const isExternal = src.startsWith('http://') || src.startsWith('https://');
  
  return (
    <Image
      src={src}
      alt={`${sym} icon`}
      width={size}
      height={size}
      className={`inline-block rounded-full flex-shrink-0 ${className}`}
      style={{ width: size, height: size, objectFit: "contain" }}
      unoptimized={isExternal}
      onError={() => setImageError(true)}
    />
  );
}

export default TokenIcon;
