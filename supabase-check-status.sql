-- Check system status
-- Run these queries in Supabase SQL Editor to see what's happening

-- 1. Check pending news (not posted yet)
SELECT 
  id, 
  title, 
  priority, 
  pub_date, 
  posted_to_twitter, 
  source,
  EXTRACT(EPOCH FROM (NOW() - pub_date))/60 as minutes_ago
FROM news_posts
WHERE posted_to_twitter = false
ORDER BY pub_date DESC
LIMIT 10;

-- 2. Check recent news (last 24 hours)
SELECT 
  COUNT(*) as total_news,
  COUNT(*) FILTER (WHERE posted_to_twitter = true) as posted,
  COUNT(*) FILTER (WHERE posted_to_twitter = false) as pending,
  COUNT(*) FILTER (WHERE priority >= 70) as high_priority,
  COUNT(*) FILTER (WHERE priority >= 70 AND posted_to_twitter = false) as high_priority_pending
FROM news_posts
WHERE pub_date >= NOW() - INTERVAL '24 hours';

-- 3. Check cron job status
SELECT 
  job_name,
  last_success_at,
  last_error_at,
  last_error_message,
  EXTRACT(EPOCH FROM (NOW() - last_success_at))/60 as minutes_since_success
FROM cron_status
ORDER BY last_success_at DESC NULLS LAST;

-- 4. Check Twitter rate limits
SELECT 
  key,
  resume_at,
  CASE 
    WHEN resume_at IS NULL THEN 'No rate limit'
    WHEN resume_at > NOW() THEN 'Rate limited until ' || resume_at::text
    ELSE 'Rate limit expired'
  END as status
FROM twitter_rate_limits;

-- 5. Check recent whale events (for Discord)
SELECT 
  COUNT(*) as total_whales,
  COUNT(*) FILTER (WHERE posted_to_discord = true) as posted_to_discord,
  COUNT(*) FILTER (WHERE posted_to_twitter = true) as posted_to_twitter,
  COUNT(*) FILTER (WHERE amount_usd >= 20000 AND posted_to_discord = false) as pending_discord
FROM whale_events
WHERE block_time >= NOW() - INTERVAL '24 hours';

-- 6. Check active alerts
SELECT 
  COUNT(*) as total_alerts,
  COUNT(DISTINCT user_id) as users_with_alerts
FROM user_alerts
WHERE is_active = true;

