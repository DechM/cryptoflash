export type SubscriptionTier = 'free' | 'pro' | 'ultimate' | 'expired'

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
  curveSpeed?: number // Bonding curve speed (progress change per hour, 0-10 scale)
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

export interface WhaleEventBreakdown {
  senders?: Array<{ owner: string; amount: number }>
  receivers?: Array<{ owner: string; amount: number }>
}

export interface WhaleEvent {
  id: string
  token_address: string
  token_symbol?: string | null
  token_name?: string | null
  event_type: 'transfer' | 'mint' | 'burn' | 'exchange' | 'buy' | 'sell'
  amount_tokens?: number | null
  amount_usd?: number | null
  price_usd?: number | null
  liquidity_usd?: number | null
  volume_24h_usd?: number | null
  sender?: string | null
  sender_label?: string | null
  receiver?: string | null
  receiver_label?: string | null
  tx_hash: string
  tx_url?: string | null
  event_data?: WhaleEventBreakdown | null
  block_time?: string | null
  fee?: number | null
  posted_to_twitter: boolean
  tweet_id?: string | null
  created_at: string
  chain?: string | null
  network?: string | null
}
export interface WhaleSubscriber {
  user_id: string
  status: 'inactive' | 'active' | 'canceled'
  plan: string
  started_at?: string
  expires_at?: string
  cancel_at?: string
  created_at: string
  updated_at: string
}

export interface DiscordLink {
  id: string
  user_id: string
  discord_user_id: string
  discord_username?: string | null
  access_token?: string | null
  refresh_token?: string | null
  token_expires_at?: string | null
  refresh_token_expires_at?: string | null
  scope?: string | null
  created_at: string
  updated_at: string
}

