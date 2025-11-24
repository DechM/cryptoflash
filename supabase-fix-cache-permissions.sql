-- Fix CoinGecko cache table permissions
-- Run this in Supabase SQL Editor to ensure cache works properly

-- Ensure coingecko_coin_cache table exists
CREATE TABLE IF NOT EXISTS coingecko_coin_cache (
  coin_id TEXT PRIMARY KEY,
  platforms JSONB,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coingecko_cache_last_updated ON coingecko_coin_cache(last_updated);

-- Disable RLS (Row Level Security) for this table
-- Service role key should have full access without RLS
ALTER TABLE coingecko_coin_cache DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies (if any)
DROP POLICY IF EXISTS "Allow service role full access" ON coingecko_coin_cache;
DROP POLICY IF EXISTS "Allow public read" ON coingecko_coin_cache;
DROP POLICY IF EXISTS "Allow public write" ON coingecko_coin_cache;

-- Grant necessary permissions (service role already has full access, but ensure it)
GRANT ALL ON coingecko_coin_cache TO service_role;
GRANT SELECT, INSERT, UPDATE ON coingecko_coin_cache TO service_role;

-- Verify table exists and has correct structure
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'coingecko_coin_cache'
  ) THEN
    RAISE NOTICE '✅ coingecko_coin_cache table exists';
  ELSE
    RAISE EXCEPTION '❌ coingecko_coin_cache table does not exist';
  END IF;
END $$;

