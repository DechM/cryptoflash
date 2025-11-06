# Twitter/X Integration Setup Guide

## Overview

CryptoFlash automatically posts KOTH alerts to Twitter/X when tokens reach 80%+ progress with score > 85.

## Features

- ✅ Automatic posting every 30 minutes (via Vercel Cron)
- ✅ Rate limiting: Max 1 post per 30 minutes, 30 posts/day
- ✅ Duplicate prevention: Each token posted only once
- ✅ Quality filter: Only tokens with score > 85
- ✅ No direct pump.fun links (Twitter-safe format)

## Setup Steps

### 1. Create Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Sign in with your Twitter account
3. Apply for Developer Access (usually instant for personal use)
4. Create a new App/Project

### 2. Get API Credentials

After creating your app, you'll need:

- **API Key** (`TWITTER_API_KEY`)
- **API Secret** (`TWITTER_API_SECRET`)
- **Bearer Token** (`TWITTER_BEARER_TOKEN`) - Recommended for v2 API
- **Access Token** (`TWITTER_ACCESS_TOKEN`) - Optional, for OAuth 1.0a
- **Access Token Secret** (`TWITTER_ACCESS_TOKEN_SECRET`) - Optional

**How to get Bearer Token:**
1. In your Twitter App settings
2. Go to "Keys and tokens" tab
3. Under "Bearer Token", click "Generate"
4. Copy the token (starts with `AAAA...`)

### 3. Set App Permissions

1. Go to your Twitter App settings
2. Navigate to "User authentication settings"
3. Enable "Read and write" permissions
4. Set callback URL: `https://yourdomain.com` (or leave blank for server-side only)
5. Save changes

### 4. Add Environment Variables to Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```bash
# Required (at least one method)
TWITTER_BEARER_TOKEN=AAAA...your_bearer_token_here

# Optional (for OAuth 1.0a - not currently used, but kept for future)
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here

# Optional: Cron secret for security (recommended)
CRON_SECRET=your_random_secret_here
```

### 5. Run Database Migration

Execute this SQL in your Supabase SQL Editor:

```sql
-- Twitter posts tracking table
CREATE TABLE IF NOT EXISTS twitter_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address TEXT NOT NULL UNIQUE,
  token_name TEXT,
  token_symbol TEXT,
  score NUMERIC,
  progress NUMERIC,
  tweet_id TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_twitter_posts_token_address ON twitter_posts(token_address);
CREATE INDEX IF NOT EXISTS idx_twitter_posts_posted_at ON twitter_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_twitter_posts_score ON twitter_posts(score DESC);
```

### 6. Verify Vercel Cron Job

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/twitter/post",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

This runs every 30 minutes. Vercel will automatically set it up after deployment.

## Testing

### Manual Test

You can manually trigger a post by calling:

```bash
curl -X POST https://yourdomain.com/api/twitter/post \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or visit in browser (GET request shows info):
```
https://yourdomain.com/api/twitter/post
```

### Check Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by `/api/twitter/post`
3. Check for success/error messages

## Rate Limits

### Twitter API v2 Free Tier:
- **1,500 tweets/month**
- **50 tweets/day** (theoretical max)
- **30 tweets/day** (our safe limit)

### Our Implementation:
- ✅ Max 1 post per 30 minutes
- ✅ Max 30 posts per day
- ✅ Duplicate prevention (each token once)
- ✅ Quality filter (score > 85, progress >= 80%)

## Post Format

Example Twitter post:

```
🚨 KOTH Alert!

💰 TokenName ($SYMBOL)
📊 Score: 92.5/100
📈 Progress: 87.3%
💵 Price: $0.000123

🔍 View on CryptoFlash:
https://cryptoflash.app

⚠️ DYOR - Not financial advice
```

**Note:** We don't include direct pump.fun links to avoid Twitter spam detection.

## Troubleshooting

### "Twitter API credentials not configured"
- Check that `TWITTER_BEARER_TOKEN` is set in Vercel
- Redeploy after adding environment variables

### "Rate limit: too soon since last post"
- This is normal - the system enforces 30-minute intervals
- Wait 30 minutes or adjust `MIN_POST_INTERVAL` in code

### "Daily post limit reached"
- Normal if you've posted 30 times today
- Resets at midnight UTC
- Check `twitter_posts` table for today's count

### "Failed to post to Twitter"
- Check Twitter API status
- Verify Bearer Token is valid
- Check Vercel logs for detailed error

### Posts not appearing
- Check Twitter account for posts
- Verify app has "Read and write" permissions
- Check `twitter_posts` table for saved records

## Monitoring

### Database Query

Check today's posts:
```sql
SELECT * FROM twitter_posts 
WHERE posted_at >= CURRENT_DATE 
ORDER BY posted_at DESC;
```

### Vercel Analytics

Monitor cron job execution:
- Vercel Dashboard → Analytics → Cron Jobs
- Check execution frequency and success rate

## Cost

- **Free**: Twitter API v2 free tier (1,500 tweets/month)
- **Vercel Cron**: Free tier includes cron jobs
- **Total**: $0/month (within free tier limits)

## Future Enhancements

- [ ] OAuth 1.0a implementation (more reliable than Bearer Token)
- [ ] Post scheduling optimization
- [ ] Engagement tracking
- [ ] A/B testing for post formats
- [ ] News integration (CoinGecko News API)

