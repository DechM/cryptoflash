// web/components/icons/TokenIcon.tsx
import Image from "next/image";

type Props = {
  symbol: string;
  size?: number;
  className?: string;
};

// Познати икони (по желание добавяй още SVG/PNG в /public/tokens/)
const KNOWN_ICONS: Record<string, string> = {
  BTC: "/tokens/btc.svg",
  ETH: "/tokens/eth.svg",
  USDT: "/tokens/usdt.svg",
  USDC: "/tokens/usdc.svg",
  SOL: "/tokens/sol.svg",
  BNB: "/tokens/bnb.svg",
  XRP: "/tokens/xrp.svg",
  ADA: "/tokens/ada.svg",
  DOGE: "/tokens/doge.svg",
  AVAX: "/tokens/avax.svg",
  MATIC: "/tokens/matic.svg",
  LINK: "/tokens/link.svg",
  DAI: "/tokens/dai.svg",
  PAXG: "/tokens/paxg.svg",
  XAUT: "/tokens/xaut.svg",
};

export function TokenIcon({ symbol, size = 20, className = "" }: Props) {
  const sym = (symbol || "").toUpperCase();
  const src = KNOWN_ICONS[sym];

  // Ако имаме файл за иконата → показваме изображение
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

  // Fallback: кръг с инициалите (НЕ показваме отделен текст извън иконата)
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
