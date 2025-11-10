# PumpKing Sniper 🎯

Real-time KOTH (King of the Hill) tracker for Pump.fun memecoins on Solana. Get early alerts, track bonding curve progress, and snipe winners before they moon!

## Features

- 📊 **Real-time KOTH Tracking** - Live dashboard with top 50 tokens in bonding curve phase
- 🚨 **Discord Alerts** - Get notified when tokens reach your threshold
- 📈 **AI Snipe Score** - Calculate 0-100 score based on multiple factors
- 🔥 **Heatmap Visualization** - Visual representation of KOTH candidates
- 💎 **Freemium Model** - Free tier with Pro upgrades ($4.99/mo)
- 📱 **Mobile Optimized** - Fully responsive, mobile-first design

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **APIs**: 
  - Moralis (Pump.fun bonding curve data)
  - Dexscreener (Volume & price data)
  - Helius (Whale tracking)
  - Discord Bot (Alerts)

## Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MORALIS_API_KEY`
   - `HELIUS_API_KEY`
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_ALERT_CHANNEL_ID`
   - `DISCORD_KOTH_CHANNEL_ID`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_APP_URL`

3. **Set up Supabase database**:
   Run the SQL schema in `supabase-schema.sql` in your Supabase SQL Editor

4. **Set up Stripe**:
   - Create Stripe account
   - Get API keys
   - Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Add webhook secret to `.env.local`

5. **Run development server**:
   ```bash
   npm run dev
   ```

## Deployment

### Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The `vercel.json` includes cron job configuration for automatic alert checking every 5 minutes.

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Main dashboard page
│   ├── alerts/           # Alert management
│   ├── premium/          # Subscription page
│   └── bg-leaderboard/   # BG leaderboard
├── components/           # React components
├── lib/                  # Utilities & API clients
│   ├── api/             # External API integrations
│   ├── score.ts         # AI score calculation
│   └── subscription.ts  # Subscription logic
└── supabase-schema.sql  # Database schema
```

## Free vs Pro Features

### Free
- Dashboard access (60s refresh)
- 1 active alert
- Alerts at 95%+ score
- 10 alerts/day limit

### Pro ($4.99/mo)
- Dashboard access (15-30s refresh)
- Unlimited alerts
- Early alerts at 85%+ score
- Custom thresholds (80-100%)
- Alert history
- Advanced filters
- Watchlist (up to 20 tokens)

## API Endpoints

- `GET /api/koth-data` - Fetch top 50 KOTH tokens
- `POST /api/alerts/subscribe` - Create alert subscription
- `GET /api/alerts/history` - Get alert history (Pro only)
- `POST /api/alerts/send` - Send alerts (cron job)
- `GET /api/user/tier` - Get user subscription tier
- `POST /api/premium/create-checkout` - Create Stripe checkout
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

## Contributing

This is a private project, but suggestions are welcome!

## License

Private - All rights reserved

---

Made with ❤️ for Solana degens
