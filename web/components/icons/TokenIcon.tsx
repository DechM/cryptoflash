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
  const sym = (symbol || "").toUpperCase();

  // Priority: 1) CoinGecko image URL, 2) Local fallback
  const src = imageUrl || KNOWN_ICONS[sym];

  if (src) {
    // Check if it's an external URL (CoinGecko) or local
    const isExternal = src.startsWith('http://') || src.startsWith('https://');
    
    if (isExternal) {
      // For external URLs, use Next.js Image with domain whitelist
      // Using unoptimized for external images to avoid potential CORS issues
      return (
        <Image
          src={src}
          alt={`${sym} icon`}
          width={size}
          height={size}
          className={`inline-block rounded-full flex-shrink-0 ${className}`}
          style={{ width: size, height: size, objectFit: "contain" }}
          unoptimized={true}
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="inline-flex items-center justify-center rounded-full bg-muted/40 font-medium text-muted-foreground" style="width: ${size}px; height: ${size}px; font-size: ${Math.max(9, size * 0.4)}px; line-height: 1;">${sym.length <= 3 ? sym : sym.slice(0, 2)}</span>`;
            }
          }}
        />
      );
    } else {
      // Local image
      return (
        <Image
          src={src}
          alt={`${sym} icon`}
          width={size}
          height={size}
          className={`inline-block rounded-full flex-shrink-0 ${className}`}
          style={{ width: size, height: size, objectFit: "contain" }}
        />
      );
    }
  }

  // 3) накрая – инициали, без да "счупваме" layout
  // Use first 2-3 chars depending on symbol length
  const initials = sym.length <= 3 ? sym : sym.slice(0, 2);
  const fontSize = initials.length > 2 ? Math.max(8, size * 0.35) : Math.max(9, size * 0.4);
  
  return (
    <span
      aria-label={`${sym} icon`}
      className={`inline-flex items-center justify-center rounded-full bg-muted/40 font-medium text-muted-foreground ${className}`}
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

export default TokenIcon;
