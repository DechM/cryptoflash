// Aggressive caching for alerts to minimize API calls

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
};

class AlertCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Get cache entry if still valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance
export const alertCache = new AlertCache();

// Cache keys
export const CACHE_KEYS = {
  alerts: (blockchain: string) => `alerts:${blockchain}`,
  transaction: (txHash: string) => `tx:${txHash}`,
  addressLabel: (address: string) => `label:${address}`,
  walletBalance: (address: string) => `balance:${address}`,
} as const;

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
  alerts: 60000,          // 1 minute for alerts
  transaction: 3600000,   // 1 hour for transaction details
  addressLabel: 86400000, // 24 hours for address labels
  walletBalance: 300000,  // 5 minutes for wallet balances
} as const;

