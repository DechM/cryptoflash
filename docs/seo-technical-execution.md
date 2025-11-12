## Technical Execution – Ecosystem Checklist

This document captures the operational steps for keeping CryptoFlash's technical SEO ecosystem healthy. Use it as a runbook whenever we deploy new content or features.

### 1. Search Console

1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Add a new property using the **URL prefix** `https://cryptoflash.app/`.
3. Verify ownership with the HTML tag method (recommended for Vercel):
   - In Search Console choose **HTML tag**.
   - Copy the `<meta name="google-site-verification">…</meta>` snippet.
   - Add the token to `.env` as `GOOGLE_SITE_VERIFICATION`.
   - Redeploy the site; the tag is injected from `app/layout.tsx`.
   - Click **Verify** in Search Console.
4. Submit the sitemap: `https://cryptoflash.app/sitemap.xml`.
5. Schedule a monthly review:
   - Coverage issues.
   - Enhancement reports (FAQ, Product, Article schema).
   - Performance tab (queries, CTR, average position).

### 2. GA4 / Analytics

1. In [Google Analytics](https://analytics.google.com), create a GA4 property if not already provisioned.
2. Grab the measurement ID (`G-XXXXXXXXXX`).
3. Set the ID in `.env` as `GA_MEASUREMENT_ID` (Map it to the existing `G-L3NYZ6V64K` placeholder if migrating).
4. Confirm events:
   - Page view baseline (handled automatically by gtag).
   - Optional: define custom events for Solana Pay flow, Discord linking, KOTH exports.
5. Enable BigQuery export (optional) for deeper funnel analysis.

### 3. Lighthouse & Core Web Vitals

Run Lighthouse for both device profiles on every major release.

```bash
# mobile audit
npx lighthouse https://cryptoflash.app/ --preset=mobile --output html --output-path=./reports/lighthouse-mobile.html

# desktop audit
npx lighthouse https://cryptoflash.app/ --preset=desktop --output html --output-path=./reports/lighthouse-desktop.html
```

Record the metrics in a shared sheet (LCP, INP/TBT, CLS, Performance score). If scores fall below 80 on mobile:

- Audit unused JavaScript via the bundle analyzer (`ANALYZE=true npm run build -- --webpack`).
- Ensure hero imagery is preloaded and compressed.
- Check that marketing pages stay static (no unnecessary `use client`).

### 4. Robots & Sitemap Validation

- Validate `robots.txt` in Search Console → `https://cryptoflash.app/robots.txt`.
- After each sitemap change, hit the **Inspect URL** tool on a few key pages (`/`, `/whale-alerts`, `/premium`, newest blog post) to force re-crawl.

### 5. Release Checklist (SEO-focused)

- [ ] Metadata updated for new pages.
- [ ] Structured data passes Rich Results test (FAQ, HowTo/Product, Article).
- [ ] Sitemap regenerated (already automatic, but confirm new routes exist).
- [ ] Lighthouse scores captured.
- [ ] Search Console coverage checked for new URLs.

Keep this document updated as we add tooling (e.g., Plausible, LogRocket, additional CDNs).***

