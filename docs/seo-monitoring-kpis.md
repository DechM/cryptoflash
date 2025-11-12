## SEO Monitoring & KPI Runbook

This document defines the metrics we track for CryptoFlash’s organic performance and how/when to review them.

### 1. Core KPIs

| KPI | Source | Target cadence | Notes |
| --- | --- | --- | --- |
| Impressions & clicks (organic search) | Google Search Console → Performance | Monthly | Track top queries, filter by country “All”, device “Desktop/Mobile” |
| Average position for primary keywords | Google Search Console | Monthly | Keywords: “KOTH tracker”, “whale alerts”, “pump.fun alerts”, “crypto whale tracker” |
| Organic sessions / users | GA4 → Reports → Acquisition | Monthly | Segment by landing page to identify highest converting content |
| Referral traffic share | GA4 → Acquisition → Traffic acquisition | Monthly | Measures impact of off-page outreach |
| Newsletter subscribers | ESP dashboard (to be determined) | Monthly | Target +15% MoM once launch occurs |
| Backlinks earned | Ahrefs/Semrush (if available) or manual tracking | Quarterly | Log new Tier A/B backlinks in shared spreadsheet |
| Lighthouse Mobile Performance score | Local Lighthouse run | At major releases (> monthly) | Target ≥ 80 |

### 2. Monitoring Cadence

| Timeframe | Tasks |
| --- | --- |
| **Monthly (Week 1)** | Pull Search Console + GA4 data → update shared KPI sheet. Note top rising/falling pages. |
| | Review newsletter subscriber count and referral breakdown. |
| | Run Lighthouse mobile + desktop. Log scores and key diagnostics in `reports/` folder. |
| **Quarterly** | Audit backlink profile; outreach if Tier A/B links didn’t grow by ≥5. |
| | Refresh top-performing blog posts (update stats, add internal links). |
| | Revisit content calendar to slot trending topics. |
| **Ad-hoc** | After each major feature launch, re-run Lighthouse and inspect Search Console for indexing errors. |

Use a shared Google Sheet (or Notion database) titled **“CryptoFlash SEO Dashboard”** with the following columns:
- Date (YYYY-MM-DD)
- Impressions
- Clicks
- Avg Position (primary keyword basket)
- Organic sessions
- Referral sessions (%)
- Newsletter subs
- Backlinks (total + Tier A/B count)
- Lighthouse Mobile (score + notes)
- Action items

### 3. Alerting

- Search Console: enable email notifications for coverage issues and schema errors.
- GA4: set up custom alerts for spikes/drops (e.g., sessions -30% week-over-week).
- Optional: use a simple cron (or Vercel cron) to ping Bitquery/CoinGecko rate limit endpoints and post warnings to Discord if usage > 80%.

### 4. Content Refresh Plan

- Every quarter select the top 3 evergreen articles by clicks and add:
  - Updated stats/screenshots
  - Cross-link to new features or FAQ entries
  - A “Last updated on” note in the intro
- For pages with declining impressions (>20% drop over 2 months), evaluate if keyword intent has shifted and adjust headings/meta accordingly.

### 5. Owned Dashboard (Future)

If we expand the monitoring page (`/monitoring`), consider adding:
- Search Console clicks/impressions via API (requires service account).
- GA4 sessions line chart (via Reporting API).
- Lighthouse score history pulled from GitHub Actions (weekly run).

For now, manual tracking in the shared sheet is sufficient while we focus on publishing new content.***

