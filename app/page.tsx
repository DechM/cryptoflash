import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight } from "lucide-react";
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

const heroStats = [
  { label: "Discord alerts fired", value: "12,400+" },
  { label: "Cross-chain whales tracked", value: "20+" },
  { label: "Avg. response time", value: "< 60 sec" },
];

const productPillars = [
  {
    title: "Live KOTH Telemetry",
    copy: "Follow progress, velocity and liquidity for every bonding curve. Stay focused on the tokens that are about to unlock.",
    badge: "📊",
  },
  {
    title: "Automated Discord Delivery",
    copy: "Link once, get role-synced alerts instantly. Ultimate teams layer custom rules without managing bots.",
    badge: "⚡",
  },
  {
    title: "Cross-chain Whale Radar",
    copy: "Bitquery + CoinGecko power curated $20K+ moves. Every embed includes wallet flow, chain and transaction link.",
    badge: "🌐",
  },
];

const workflowHighlights = [
  {
    title: "Hourly token refresh",
    details: "CoinGecko + Bitquery scans pull fresh liquidity, volume and whale inflows without rate-limit surprises.",
  },
  {
    title: "Role-aware routing",
    details: "Discord roles stay synced. Paid users see premium channels automatically, free users stick to public intel.",
  },
  {
    title: "Twitter-ready threads",
    details: "Dynamic hooks ensure every X post feels organic. No repeated copy, no compliance red flags.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#050B18]">
      <MarketingNavbar />

      <main className="flex-1 w-full">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 space-y-24">
          <section className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] items-center">
            <div className="space-y-8 text-left">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-white/10 text-[#00FFA3] border border-[#00FFA3]/30">
                Pump.fun traders • Whale watchers • Discord-first teams
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-semibold text-white leading-tight">
                React before the curve unlocks. Capture whales the moment they move.
              </h1>
              <p className="text-base md:text-lg text-[#c3cfde] max-w-xl">
                CryptoFlash blends live KOTH telemetry with $20K+ cross-chain whale alerts. No spreadsheets. No bot wrangling.
                Just actionable flow routed to Discord & X in seconds.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  prefetch={false}
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl bg-[#00FFA3] text-[#04121f] font-semibold px-6 py-3 text-sm md:text-base shadow-lg shadow-[#00FFA3]/20 hover:-translate-y-0.5 transition-transform"
                >
                  Open KOTH Dashboard
                </Link>
                <Link
                  prefetch={false}
                  href="/whale-alerts"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 text-sm md:text-base text-white px-6 py-3 hover:bg-white/10 transition-colors"
                >
                  Explore Whale Alerts
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-lg font-semibold text-white">{stat.value}</p>
                    <p className="text-xs uppercase tracking-widest text-[#7b8ba5]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card relative overflow-hidden rounded-3xl border border-[#1d2a44] bg-[#0d172a] px-8 py-10">
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#00FFA3]/10 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#1d4ed8]/20 blur-3xl" />
              <div className="relative space-y-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#64748b]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00FFA3]" />
                  Latest Whale Push
                </div>
                <p className="text-sm text-[#d1d9e8] leading-relaxed">
                  $482K buy detected on Base. Discord embed includes wallet flow, transaction link and next review window.
                </p>
                <div className="space-y-2 text-sm text-[#94A3B8]">
                  <p>• Chain: Base</p>
                  <p>• Route: Ultimate Discord + Twitter auto-post</p>
                  <p>• Confidence: High (3 tracked wallets)</p>
                </div>
                <Link
                  prefetch={false}
                  href="/premium"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#00FFA3] hover:underline"
                >
                  View pricing & perks
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {productPillars.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition hover:-translate-y-1 hover:bg-white/[0.04]"
              >
                <div className="text-2xl">{item.badge}</div>
                <h2 className="mt-3 text-lg font-heading text-white">{item.title}</h2>
                <p className="mt-4 text-sm text-[#b8c5d6] leading-relaxed">{item.copy}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-10">
            <div className="max-w-3xl space-y-4">
              <h3 className="text-2xl md:text-3xl font-heading text-white">
                The workflow high-volume teams rely on
              </h3>
              <p className="text-sm md:text-base text-[#c3cfde]">
                CryptoFlash cron jobs fan out every few minutes. Your traders see the right channel at the right time while we
                handle the integrations, rate-limit math and message formatting.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {workflowHighlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-[#0b1527] p-6">
                  <h4 className="text-base font-semibold text-white">{item.title}</h4>
                  <p className="mt-3 text-sm text-[#94A3B8] leading-relaxed">{item.details}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#00FFA3]/20 bg-[#00ffa3]/5 p-10 text-center space-y-6">
            <h3 className="text-3xl font-heading text-white">Ready to level up your signal?</h3>
            <p className="text-sm md:text-base text-[#0b2335]/80 md:max-w-2xl mx-auto">
              Join traders who automate KOTH unlocks, cross-chain whale flows and premium Discord delivery with CryptoFlash.
              Pick the plan that fits your runway and start receiving alerts in under two minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                prefetch={false}
                href="/premium"
                className="inline-flex items-center justify-center rounded-xl bg-[#04121f] text-white px-6 py-3 text-sm md:text-base font-semibold hover:bg-[#04121f]/80 transition-colors"
              >
                View Premium Plans
              </Link>
              <Link
                prefetch={false}
                href="/faq"
                className="inline-flex items-center justify-center rounded-xl border border-[#04121f]/30 text-sm md:text-base text-[#04121f] px-6 py-3 hover:bg-white/20 transition-colors"
              >
                Read the FAQ
              </Link>
            </div>
            <p className="text-xs uppercase tracking-widest text-[#04121f]/70">
              Free tier available • Discord + Twitter automations included
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
