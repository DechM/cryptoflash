-- PumpKing Sniper Database Schema
-- Run this in Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  telegram_username TEXT, -- deprecated (legacy Telegram support)
  telegram_chat_id TEXT UNIQUE, -- deprecated (legacy Telegram support)
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'ultimate', 'expired')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- User alerts table
CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_address TEXT, -- null = all tokens
  alert_type TEXT NOT NULL DEFAULT 'score' CHECK (alert_type IN ('score', 'progress', 'volume', 'price')),
  threshold_value NUMERIC NOT NULL DEFAULT 95,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_active ON user_alerts(is_active);

-- Alert history table
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  token_name TEXT,
  token_symbol TEXT,
  alert_score NUMERIC,
  alert_progress NUMERIC,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE alert_history
  ADD COLUMN IF NOT EXISTS alert_score NUMERIC;

ALTER TABLE alert_history
  ADD COLUMN IF NOT EXISTS alert_progress NUMERIC;

ALTER TABLE alert_history
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alert_history_user_id ON alert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_created_at ON alert_history(created_at);
CREATE INDEX IF NOT EXISTS idx_alert_history_sent_at ON alert_history(sent_at);

-- User watchlist table
CREATE TABLE IF NOT EXISTS user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON user_watchlist(user_id);

-- KOTH tokens cache table
CREATE TABLE IF NOT EXISTS koth_tokens (
  token_address TEXT PRIMARY KEY,
  name TEXT,
  symbol TEXT,
  progress NUMERIC,
  score NUMERIC,
  data JSONB, -- Full token data
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_koth_tokens_score ON koth_tokens(score DESC);
CREATE INDEX IF NOT EXISTS idx_koth_tokens_updated_at ON koth_tokens(updated_at);

-- API calls tracking (for rate limiting)
CREATE TABLE IF NOT EXISTS api_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT,
  called_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_calls_user_id ON api_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_called_at ON api_calls(called_at);

-- Crypto payments table (Solana Pay)
CREATE TABLE IF NOT EXISTS crypto_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'ultimate', 'whale')),
  amount_usdc NUMERIC NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'expired', 'failed')),
  tx_signature TEXT,
  confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_crypto_payments_session_id ON crypto_payments(session_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_user_id ON crypto_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_status ON crypto_payments(status);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_tx_signature ON crypto_payments(tx_signature) WHERE tx_signature IS NOT NULL;

-- Twitter posts tracking table
CREATE TABLE IF NOT EXISTS twitter_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address TEXT NOT NULL UNIQUE, -- Prevent duplicate posts for same token
  token_name TEXT,
  token_symbol TEXT,
  score NUMERIC,
  progress NUMERIC,
  tweet_id TEXT, -- Twitter tweet ID for reference
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_twitter_posts_token_address ON twitter_posts(token_address);
CREATE INDEX IF NOT EXISTS idx_twitter_posts_posted_at ON twitter_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_twitter_posts_score ON twitter_posts(score DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (for now, allow all - adjust based on auth requirements)
CREATE POLICY "Allow all users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all alerts" ON user_alerts FOR ALL USING (true);
CREATE POLICY "Allow all history" ON alert_history FOR ALL USING (true);
CREATE POLICY "Allow all watchlist" ON user_watchlist FOR ALL USING (true);
CREATE POLICY "Allow all api_calls" ON api_calls FOR ALL USING (true);
CREATE POLICY "Allow all crypto_payments" ON crypto_payments FOR ALL USING (true);

-- Functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_alerts_updated_at BEFORE UPDATE ON user_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_payments_updated_at BEFORE UPDATE ON crypto_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Whale Alerts: Top tokens snapshot from Birdeye
CREATE TABLE IF NOT EXISTS whale_top_tokens (
  token_address TEXT PRIMARY KEY,
  token_symbol TEXT,
  token_name TEXT,
  price_usd NUMERIC,
  liquidity_usd NUMERIC,
  volume_24h_usd NUMERIC,
  txns_24h INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  coingecko_id TEXT,
  chain TEXT,
  network TEXT,
  contract_address TEXT,
  source TEXT
);

-- Whale Alerts: Detected whale transfer events
CREATE TABLE IF NOT EXISTS whale_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  token_name TEXT,
  event_type TEXT NOT NULL,
  amount_tokens NUMERIC,
  amount_usd NUMERIC,
  price_usd NUMERIC,
  liquidity_usd NUMERIC,
  volume_24h_usd NUMERIC,
  sender TEXT,
  sender_label TEXT,
  receiver TEXT,
  receiver_label TEXT,
  tx_hash TEXT NOT NULL,
  tx_url TEXT,
  event_data JSONB,
  block_time TIMESTAMPTZ,
  fee NUMERIC,
  posted_to_twitter BOOLEAN DEFAULT FALSE,
  tweet_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  chain TEXT,
  network TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_whale_events_tx_hash ON whale_events(tx_hash);
CREATE INDEX IF NOT EXISTS idx_whale_events_block_time ON whale_events(block_time DESC);


-- Twitter Rate Limit State
CREATE TABLE IF NOT EXISTS twitter_rate_limits (
  key TEXT PRIMARY KEY,
  resume_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_twitter_rate_limits_updated_at BEFORE UPDATE ON twitter_rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS cron_status (
  job_name TEXT PRIMARY KEY,
  last_success_at TIMESTAMPTZ,
  last_success_summary JSONB,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_cron_status_updated_at BEFORE UPDATE ON cron_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE alert_history
  ADD COLUMN IF NOT EXISTS token_symbol TEXT;


-- Whale Alerts Subscriptions
CREATE TABLE IF NOT EXISTS whale_subscribers (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'canceled')),
  plan TEXT NOT NULL DEFAULT 'standard',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discord_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discord_user_id TEXT NOT NULL,
  discord_username TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_discord_links_user_id ON discord_links(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_discord_links_discord_user_id ON discord_links(discord_user_id);

CREATE TABLE IF NOT EXISTS discord_oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  redirect_path TEXT
);

ALTER TABLE discord_oauth_states
  ADD COLUMN IF NOT EXISTS redirect_path TEXT;

CREATE TRIGGER update_whale_subscribers_updated_at BEFORE UPDATE ON whale_subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discord_links_updated_at BEFORE UPDATE ON discord_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE IF NOT EXISTS whale_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF NOT EXISTS discord_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF NOT EXISTS discord_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS select_own_whale_subscription ON whale_subscribers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS update_own_whale_subscription ON whale_subscribers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS insert_own_whale_subscription ON whale_subscribers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS select_own_discord_link ON discord_links
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS delete_own_discord_link ON discord_links
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS insert_own_discord_link ON discord_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS update_own_discord_link ON discord_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS select_own_oauth_state ON discord_oauth_states
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS delete_own_oauth_state ON discord_oauth_states
  FOR DELETE USING (auth.uid() = user_id);

