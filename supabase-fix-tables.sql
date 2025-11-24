-- Fix missing tables and ensure all required tables exist
-- Run this in Supabase SQL Editor

-- Twitter Rate Limit State (if missing)
CREATE TABLE IF NOT EXISTS twitter_rate_limits (
  key TEXT PRIMARY KEY,
  resume_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS update_twitter_rate_limits_updated_at ON twitter_rate_limits;
CREATE TRIGGER update_twitter_rate_limits_updated_at BEFORE UPDATE ON twitter_rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CoinGecko coin cache (if missing)
CREATE TABLE IF NOT EXISTS coingecko_coin_cache (
  coin_id TEXT PRIMARY KEY,
  platforms JSONB,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coingecko_cache_last_updated ON coingecko_coin_cache(last_updated);

-- Verify all required tables exist
DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  table_name TEXT;
  required_tables TEXT[] := ARRAY[
    'users',
    'user_alerts',
    'alert_history',
    'koth_tokens',
    'crypto_payments',
    'twitter_posts',
    'whale_subscribers',
    'discord_links',
    'discord_oauth_states',
    'whale_top_tokens',
    'whale_events',
    'cron_status',
    'twitter_rate_limits',
    'news_posts',
    'x_user_ids',
    'coingecko_coin_cache'
  ];
BEGIN
  FOREACH table_name IN ARRAY required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      missing_tables := array_append(missing_tables, table_name);
    END IF;
  END LOOP;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE 'Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE 'All required tables exist ✅';
  END IF;
END $$;

