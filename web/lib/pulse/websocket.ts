// WebSocket manager for real-time Pulse Stream updates
import type { PulseTrade } from './stream';

type PulseListener = (trade: PulseTrade) => void;

declare global {
  var __pulseWS: PulseWebSocket | undefined;
}

class PulseWebSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<PulseListener>();
  private reconnectTimer?: NodeJS.Timeout;
  private isConnected = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    try {
      // For MVP: Simulate WebSocket with polling fallback
      // In production: Use actual WebSocket endpoint
      // const url = 'wss://api.cryptoflash.app/pulse/stream';
      // this.ws = new WebSocket(url);
      
      // Simulate connection
      this.isConnected = true;
      
      // Simulate real-time updates every 5 seconds
      this.simulateUpdates();
      
      // For real WebSocket:
      // this.ws.onopen = () => { this.isConnected = true; };
      // this.ws.onclose = () => this.scheduleReconnect();
      // this.ws.onerror = () => this.scheduleReconnect();
      // this.ws.onmessage = (ev) => {
      //   const trade = JSON.parse(ev.data) as PulseTrade;
      //   this.notifyListeners(trade);
      // };
    } catch {
      this.scheduleReconnect();
    }
  }

  private simulateUpdates() {
    // Simulate live trades for demo
    if (typeof window === 'undefined') return;
    
    setInterval(async () => {
      if (this.listeners.size === 0) return;
      
      const { getPulseStream } = await import('./stream');
      const trades = await getPulseStream(5); // Get 5 latest
      
      if (trades.length > 0) {
        const latestTrade = trades[0];
        this.notifyListeners(latestTrade);
      }
    }, 5000); // Every 5 seconds
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, 3000);
  }

  subscribe(listener: PulseListener): () => void {
    this.listeners.add(listener);
    
    // Connect if not already connected
    if (!this.isConnected) {
      this.connect();
    }
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(trade: PulseTrade) {
    this.listeners.forEach((listener) => {
      try {
        listener(trade);
      } catch (error) {
        console.error('Error in pulse listener:', error);
      }
    });
  }
}

export function getPulseWebSocket(): PulseWebSocket {
  if (typeof window === 'undefined') {
    return {
      subscribe: () => () => {},
    } as unknown as PulseWebSocket;
  }

  if (!globalThis.__pulseWS) {
    globalThis.__pulseWS = new PulseWebSocket();
  }
  return globalThis.__pulseWS;
}
