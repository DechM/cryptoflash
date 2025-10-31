import Image from "next/image";

type Props = {
  symbol: string;
  size?: number;
  className?: string;
  imageUrl?: string; // <-- ново
};

// локален map (можеш да добавяш)
// остави само най-важните – останалото идва от CoinGecko image
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

  // 1) ако имаме URL от CoinGecko → ползваме него
  const firstSrc = imageUrl;

  // 2) иначе – локална иконка ако я има
  const fallbackLocal = KNOWN_ICONS[sym];

  const src = firstSrc ?? fallbackLocal;

  if (src) {
    return (
      <Image
        src={src}
        alt={`${sym} icon`}
        width={size}
        height={size}
        className={`inline-block rounded-full ${className}`}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }

  // 3) накрая – инициали, без да “счупваме” layout
  const initials = sym.slice(0, 3);
  return (
    <span
      aria-label={`${sym} icon`}
      className={`inline-flex items-center justify-center rounded-full bg-muted/40 text-[10px] font-medium text-muted-foreground ${className}`}
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

export default TokenIcon;
