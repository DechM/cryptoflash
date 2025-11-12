import Link from "next/link";
import { Metadata } from "next";
import { MarketingNavbar } from "@/components/MarketingNavbar";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://cryptoflash.app").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "CryptoFlash | Real-time KOTH & Whale Intelligence",
  description:
    "Monitor Pump.fun King of the Hill candidates, track $20K+ whale moves and automate Discord alerts. CryptoFlash gives you the data edge to trade bonding curves before they unlock.",
  alternates: {
    canonical: siteUrl,
  },
};

const sellingPoints = [
  {
    title: "Live KOTH Telemetry",
    description:
      "Track AI Snipe Score, bonding-curve progress, liquidity and velocity in real time. Export snapshots and journal every trade.",
  },
  {
    title: "Automated Discord Alerts",
    description:
      "Link your Discord once and get KOTH alerts at 95% / 85% / 80%, plus curated $20K+ whale embeds with transaction context.",
  },
  {
    title: "Cross-chain Whale Radar",
    description:
      "Monitor the top EVM tokens with Bitquery + CoinGecko data, $20K thresholds and premium Discord/Twitter delivery.",
  },
];

const featureBullets = [
  "Unlimited alert rules with Ultimate",
  "Hourly top tokens from CoinGecko",
  "Dynamic Twitter hooks for every alert",
  "CSV exports & historical alert log",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B1020] w-full flex flex-col">
      <MarketingNavbar />

      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12 flex-1">
        <div className="max-w-6xl mx-auto space-y-16">
          <section className="text-center space-y-6">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-white/10 text-[#00FFA3] border border-[#00FFA3]/30">
              Pump.fun Traders + Whale Watchers
            </span>
            <h1 className="text-3xl md:text-5xl font-heading font-semibold text-white leading-tight">
              CryptoFlash keeps you ahead of KOTH unlocks and $20K+ whale moves
            </h1>
            <p className="text-base md:text-lg text-[#b8c5d6] max-w-3xl mx-auto">
              Combine real-time KOTH telemetry, automated Discord alerts and cross-chain whale intelligence to react before the curve unlocks. Designed for traders who need signal, not noise.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                prefetch={false}
                href="/dashboard"
                className="btn-cta-login px-6 py-3 rounded-xl text-sm md:text-base"
              >
                Open KOTH Dashboard
              </Link>
              <Link
                prefetch={false}
                href="/premium"
                className="px-6 py-3 rounded-xl border border-white/20 text-sm md:text-base text-white hover:bg-white/10 transition-colors"
              >
                View Premium Plans
              </Link>
            </div>
            <p className="text-xs text-[#94A3B8]">
              No credit card for Free tier • Discord alerts ready in under 2 minutes
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {sellingPoints.map((item) => (
              <div key={item.title} className="glass-card rounded-2xl p-6 text-left border border-white/10">
                <h2 className="text-lg font-heading text-white mb-3">{item.title}</h2>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </section>

          <section className="glass-card rounded-2xl p-6 md:p-8 border border-white/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-4">
                <h3 className="text-xl md:text-2xl font-heading text-white">
                  Alerts that actually move with the market
                </h3>
                <p className="text-sm md:text-base text-[#b8c5d6] max-w-2xl">
                  CryptoFlash cron jobs monitor CoinGecko, Bitquery and your custom alert rules every few minutes. Discord roles are synced automatically so your team sees alerts instantly without juggling bots.
                </p>
                <ul className="grid gap-2 text-sm text-[#94A3B8] md:grid-cols-2">
                  {featureBullets.map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>
              </div>
              <div className="glass-card rounded-xl border border-white/10 px-6 py-5 text-left max-w-sm">
                <p className="text-xs uppercase tracking-widest text-[#64748b] mb-2">Latest whale push</p>
                <p className="text-sm text-[#94A3B8] mb-4">
                  $482K buy spotted on Base — posted to Discord + X with context and wallet flow breakdown.
                </p>
                <Link
                  prefetch={false}
                  href="/whale-alerts"
                  className="text-[#00FFA3] hover:underline text-sm font-semibold"
                >
                  Explore Whale Alerts →
                </Link>
              </div>
            </div>
          </section>

          <section className="text-center space-y-4">
            <h3 className="text-2xl md:text-3xl font-heading text-white">Ready to level up your signal?</h3>
            <p className="text-sm md:text-base text-[#94A3B8]">
              Join hundreds of traders who rely on CryptoFlash every day to catch KOTH unlocks and follow smart money.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                prefetch={false}
                href="/alerts"
                className="px-5 py-3 rounded-xl border border-white/20 text-sm md:text-base text-white hover:bg-white/10 transition-colors"
              >
                Configure Alerts
              </Link>
              <Link
                prefetch={false}
                href="/faq"
                className="px-5 py-3 rounded-xl text-sm md:text-base text-[#00FFA3] border border-[#00FFA3]/30 hover:bg-[#00FFA3]/10 transition-colors"
              >
                Read the FAQ
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
