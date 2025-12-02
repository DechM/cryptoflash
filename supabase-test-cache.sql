-- Test CoinGecko cache table
-- Run this in Supabase SQL Editor to verify cache is working

-- 1. Check if table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'coingecko_coin_cache';

-- 2. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'coingecko_coin_cache';

-- 3. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'coingecko_coin_cache'
ORDER BY ordinal_position;

-- 4. Check if there are any RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'coingecko_coin_cache';

-- 5. Try to insert a test record (should work if permissions are correct)
-- This will fail if RLS is blocking, but that's OK - we'll see the error
INSERT INTO coingecko_coin_cache (coin_id, platforms, last_updated)
VALUES ('test-coin', '{"ethereum": "0x123"}'::jsonb, NOW())
ON CONFLICT (coin_id) DO UPDATE SET
  platforms = EXCLUDED.platforms,
  last_updated = EXCLUDED.last_updated;

-- 6. Check if test record was inserted
SELECT * FROM coingecko_coin_cache WHERE coin_id = 'test-coin';

-- 7. Clean up test record
DELETE FROM coingecko_coin_cache WHERE coin_id = 'test-coin';

