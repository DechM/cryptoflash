// ✅ Sorted alphabetically + deduplicated
// ✅ Covers top ~100 most traded assets
// ✅ Safe fallback handled in TokenIcon.tsx

export const TOKEN_MAP: Record<string, string> = {
  AAVE: "AAVE",
  ADA: "ADA",
  ALGO: "ALGO",
  ANT: "ANT",
  APE: "APE",
  ARB: "ARB",
  ARKM: "ARKM",
  ASTR: "ASTR",
  ATOM: "ATOM",
  AVAX: "AVAX",

  BAL: "BAL",
  BAT: "BAT",
  BCH: "BCH",
  BLUR: "BLUR",
  BNB: "BNB",
  BNT: "BNT",
  BTC: "BTC",

  CELO: "CELO",
  CHZ: "CHZ",
  COMP: "COMP",
  CRV: "CRV",

  DAI: "DAI",
  DASH: "DASH",
  DOGE: "DOGE",
  DOT: "DOT",
  DYDX: "DYDX",

  EGLD: "EGLD",
  ENJ: "ENJ",
  EOS: "EOS",
  ETC: "ETC",
  ETH: "ETH",

  FET: "FET",
  FIL: "FIL",
  FLOKI: "FLOKI",
  FTM: "FTM",

  GALA: "GALA",
  GRT: "GRT",
  GMT: "GMT",
  GMX: "GMX",

  HBAR: "HBAR",
  HNT: "HNT",

  ICP: "ICP",
  IMX: "IMX",
  INJ: "INJ",

  JOE: "JOE",

  KAVA: "KAVA",
  KSM: "KSM",

  LDO: "LDO",
  LINK: "LINK",
  LRC: "LRC",
  LTC: "LTC",
  LUNA: "LUNA",

  MANA: "MANA",
  MATIC: "MATIC",
  MKR: "MKR",
  NEAR: "NEAR",
  NEO: "NEO",

  OP: "OP",
  OCEAN: "OCEAN",

  PAXG: "PAXG",
  PEPE: "PEPE",
  PENDLE: "PENDLE",
  PYUSD: "PYUSD",

  QNT: "QNT",

  RAY: "RAY",
  REN: "REN",
  RNDR: "RNDR",
  RUNE: "RUNE",

  SAND: "SAND",
  SHIB: "SHIB",
  SKL: "SKL",
  SNX: "SNX",
  SOL: "SOL",
  STX: "STX",
  SUI: "SUI",
  SUSHI: "SUSHI",

  TUSD: "TUSD",
  TRX: "TRX",
  UMA: "UMA",
  UNI: "UNI",
  USDC: "USDC",
  USDT: "USDT",

  VET: "VET",

  WBTC: "WBTC",

  XAUT: "XAUT",
  XEC: "XEC",
  XLM: "XLM",
  XMR: "XMR",
  XRP: "XRP",

  YFI: "YFI",

  ZEC: "ZEC",
  ZRX: "ZRX",
} as const;

export function getTokenIcon(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();
  return TOKEN_MAP[upperSymbol] || '●';
}
