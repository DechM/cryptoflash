export type SubscriptionTier = 'free' | 'pro' | 'expired'

export interface User {
  id: string
  email?: string
  telegram_username?: string
  telegram_chat_id?: string
  subscription_status: SubscriptionTier
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_expires_at?: string
  created_at: string
}

export interface Token {
  tokenAddress: string
  name: string
  symbol: string
  progress: number // Bonding curve progress 0-100
  priceNative: number
  priceUsd?: number
  liquidity: number
  volume24h?: number
  volumeChange24h?: number
  score: number // AI Snipe Score 0-100
  whaleCount: number
  whaleInflows: number
  hypeScore?: number
  rugRisk: number
  fullyDilutedValuation?: number
  marketCap?: number
  createdAt: string
}

export interface UserAlert {
  id: string
  user_id: string
  token_address?: string // null = all tokens
  alert_type: 'score' | 'progress' | 'volume' | 'price'
  threshold_value: number
  is_active: boolean
  created_at: string
}

export interface AlertHistory {
  id: string
  user_id: string
  token_address: string
  token_name: string
  token_symbol: string
  alert_score: number
  alert_progress: number
  sent_at: string
  created_at: string
}

export interface WatchlistItem {
  id: string
  user_id: string
  token_address: string
  added_at: string
}

