// Binance WebSocket for real-time cryptocurrency prices
export type BinancePriceUpdate = {
  symbol: string; // e.g., "BTCUSDT", "ETHUSDT"
  price: number;
  change24h?: number;
  volume24h?: number;
};

type Listener = (update: BinancePriceUpdate) => void;

declare global {
  var __binanceWS: BinanceWebSocket | undefined;
}

// Map CoinGecko IDs to Binance symbols
const SYMBOL_MAP: Record<string, string> = {
  bitcoin: 'BTCUSDT',
  ethereum: 'ETHUSDT',
  binancecoin: 'BNBUSDT',
  solana: 'SOLUSDT',
  ripple: 'XRPUSDT',
  cardano: 'ADAUSDT',
  dogecoin: 'DOGEUSDT',
  tron: 'TRXUSDT',
  chainlink: 'LINKUSDT',
  polkadot: 'DOTUSDT',
  'polygon-ecosystem-token': 'MATICUSDT',
  'litecoin': 'LTCUSDT',
  'avalanche-2': 'AVAXUSDT',
  'uniswap': 'UNIUSDT',
  'wrapped-bitcoin': 'WBTCUSDT',
  'bitcoin-cash': 'BCHUSDT',
  'stellar': 'XLMUSDT',
  'near-protocol': 'NEARUSDT',
  'cosmos': 'ATOMUSDT',
  'algorand': 'ALGOUSDT',
  'vechain': 'VETUSDT',
  'internet-computer': 'ICPUSDT',
  'filecoin': 'FILUSDT',
  'the-graph': 'GRTUSDT',
  'the-sandbox': 'SANDUSDT',
  'decentraland': 'MANAUSDT',
  'axie-infinity': 'AXSUSDT',
  'theta-token': 'THETAUSDT',
  'aave': 'AAVEUSDT',
  'maker': 'MKRUSDT',
  'compound-governance-token': 'COMPUSDT',
  'yearn-finance': 'YFIUSDT',
  'synthetix-network-token': 'SNXUSDT',
  'curve-dao-token': 'CRVUSDT',
  '1inch': '1INCHUSDT',
  'sushi': 'SUSHIUSDT',
  'pancakeswap-token': 'CAKEUSDT',
  'shiba-inu': 'SHIBUSDT',
  'dai': 'DAIUSDT',
  'terra-luna': 'LUNAUSDT',
  'ftx-token': 'FTTUSDT',
  'crypto-com-chain': 'CROUSDT',
  'okb': 'OKBUSDT',
  'kucoin-shares': 'KCSUSDT',
  'huobi-token': 'HTUSDT',
  'leo-token': 'LEOUSDT',
  'terrausd': 'USTCUSDT',
  'terra-luna-2': 'LUNA2USDT',
  'wrapped-eos': 'EOSUSDT',
  'tezos': 'XTZUSDT',
  'monero': 'XMRUSDT',
  'dash': 'DASHUSDT',
  'zcash': 'ZECUSDT',
  'ethereum-classic': 'ETCUSDT',
  'bitcoin-sv': 'BSVUSDT',
};

class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private subscriptions = new Set<string>();
  private reconnectTimer?: NodeJS.Timeout;
  private connectTimer?: NodeJS.Timeout;
  private reconnectDelay = 1500;
  private isConnected = false;
  private isConnecting = false;
  private priceCache = new Map<string, BinancePriceUpdate>();

  constructor() {
    if (typeof window !== 'undefined') {
      // Connect when first subscription is made
    }
  }

  private connect() {
    // If already connected or connecting, skip
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.isConnecting) {
      return; // Already connecting, wait for it to complete
    }

    try {
      // Binance combined stream for mini ticker (all symbols at once)
      // Binance has a limit of 200 streams per connection
      const subscriptionsArray = Array.from(this.subscriptions)
        .filter((symbol) => symbol && typeof symbol === 'string')
        .slice(0, 200); // Limit to 200 streams max

      if (subscriptionsArray.length === 0) {
        return; // No subscriptions, don't connect
      }

      const streams = subscriptionsArray
        .map((symbol) => `${symbol.toLowerCase()}@miniTicker`)
        .join('/');

      if (streams.length === 0) {
        return; // No valid streams
      }

      const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

      // Close existing connection first if it exists
      if (this.ws) {
        try {
          this.ws.onclose = null; // Remove old handler to prevent reconnect loop
          this.ws.onerror = null;
          this.ws.close();
        } catch {
          // Ignore
        }
        this.ws = null;
        this.isConnected = false;
      }

      this.isConnecting = true;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectDelay = 1500;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = undefined;
        }
        console.log(`Binance WebSocket connected with ${subscriptionsArray.length} streams`);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          const data = msg.data || msg;

          if (data && data.s && data.c) {
            const symbol = data.s; // e.g., "BTCUSDT"
            const price = Number(data.c);
            const change24h = data.P ? Number(data.P) : undefined; // 24h price change %
            const volume24h = data.v ? Number(data.v) * price : undefined;

            const update: BinancePriceUpdate = {
              symbol,
              price,
              change24h,
              volume24h,
            };

            this.priceCache.set(symbol, update);
            this.emit(symbol, update);
          }
        } catch (error) {
          console.error('Failed to parse Binance WS message:', error);
        }
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.isConnecting = false;
        // Only log if not a clean close (code 1000) or intentional shutdown
        if (event.code !== 1000 && this.subscriptions.size > 0) {
          // Only reconnect if we still have subscriptions
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        // Suppress excessive error logging in production
        if (process.env.NODE_ENV === 'development') {
          console.error('Binance WebSocket error:', error);
        }
        this.isConnected = false;
        // Don't close immediately, let onclose handle it
      };
    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to establish Binance WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
      this.connect();
    }, this.reconnectDelay);
  }

  subscribe(coinId: string, callback: Listener): () => void {
    if (!coinId || typeof coinId !== 'string') {
      return () => {};
    }
    
    const symbol = SYMBOL_MAP[coinId.toLowerCase()];
    if (!symbol) {
      // Not available on Binance, return no-op unsubscribe
      return () => {};
    }

    if (!this.listeners.has(symbol)) {
      this.listeners.set(symbol, new Set());
    }
    this.listeners.get(symbol)!.add(callback);

    // Check cache first
    const cached = this.priceCache.get(symbol);
    if (cached) {
      callback(cached);
    }

    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.add(symbol);
      // Debounce connection attempts - wait a bit if multiple subscriptions come in quickly
      if (this.connectTimer) {
        clearTimeout(this.connectTimer);
      }
      this.connectTimer = setTimeout(() => {
        this.connectTimer = undefined;
        this.connect();
      }, 100); // Wait 100ms for more subscriptions to batch together
    }

    return () => {
      const set = this.listeners.get(symbol);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(symbol);
          this.subscriptions.delete(symbol);
          if (this.ws && this.subscriptions.size === 0) {
            try {
              this.ws.close();
            } catch {
              // Ignore
            }
          }
        }
      }
    };
  }

  private emit(symbol: string, update: BinancePriceUpdate) {
    const set = this.listeners.get(symbol);
    if (set) {
      set.forEach((cb) => cb(update));
    }
  }

  getPrice(symbol: string): BinancePriceUpdate | null {
    return this.priceCache.get(symbol) || null;
  }
}

export function getBinanceWebSocket(): BinanceWebSocket {
  if (typeof window === 'undefined') {
    return {
      subscribe: () => () => {},
      getPrice: () => null,
    } as unknown as BinanceWebSocket;
  }

  if (!globalThis.__binanceWS) {
    globalThis.__binanceWS = new BinanceWebSocket();
  }
  return globalThis.__binanceWS;
}

