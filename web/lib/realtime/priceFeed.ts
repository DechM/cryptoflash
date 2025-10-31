export type PriceTick = {
  symbol: string;
  price: number;
  change24h?: number;
};

type Listener = (t: PriceTick) => void;

declare global {
  var __priceFeed: PriceFeed | undefined;
}

class PriceFeed {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private subs = new Set<string>();
  private reconnectTimer?: NodeJS.Timeout;
  private alive = false;
  private reconnectDelay = 1500;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    try {
      if (this.subs.size === 0) {
        // No subscriptions yet, don't connect
        return;
      }

      const streams = Array.from(this.subs)
        .map((s) => `${s.toLowerCase()}@miniTicker`)
        .join('/');

      const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.alive = true;
        this.reconnectDelay = 1500; // Reset delay on successful connect
      };

      this.ws.onclose = () => {
        this.alive = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.alive = false;
        this.scheduleReconnect();
      };

      this.ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string);
          // Binance combined: { stream, data: { s: "BTCUSDT", c: "65000.00", ... } }
          const d = msg.data || msg;
          if (d && d.s && d.c) {
            const tick: PriceTick = {
              symbol: d.s,
              price: Number(d.c),
            };
            this.emit(tick);
          }
        } catch {
          // Ignore parse errors
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.alive = false;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      if (this.ws) {
        try {
          this.ws.close();
        } catch {
          // Ignore close errors
        }
      }
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000); // Exponential backoff, max 30s
      this.connect();
    }, this.reconnectDelay);
  }

  subscribe(symbol: string, cb: Listener): () => void {
    const sym = symbol.toUpperCase();

    if (!this.listeners.has(sym)) {
      this.listeners.set(sym, new Set());
    }
    this.listeners.get(sym)!.add(cb);

    if (!this.subs.has(sym)) {
      this.subs.add(sym);
      // Reconnect to include new stream
      if (this.ws) {
        try {
          this.ws.close();
        } catch {
          // Ignore close errors
        }
      }
      this.connect();
    }

    return () => {
      const set = this.listeners.get(sym);
      if (set) {
        set.delete(cb);
        if (set.size === 0) {
          this.listeners.delete(sym);
          this.subs.delete(sym);
          if (this.ws) {
            try {
              this.ws.close();
            } catch {
              // Ignore close errors
            }
          }
        }
      }
    };
  }

  private emit(t: PriceTick) {
    const set = this.listeners.get(t.symbol.toUpperCase());
    if (set) {
      set.forEach((cb) => cb(t));
    }
  }
}

export function getPriceFeed(): PriceFeed {
  if (typeof window === 'undefined') {
    // Server-side: return a no-op instance
    return {
      subscribe: () => () => {},
    } as PriceFeed;
  }

  if (!globalThis.__priceFeed) {
    globalThis.__priceFeed = new PriceFeed();
  }
  return globalThis.__priceFeed;
}
