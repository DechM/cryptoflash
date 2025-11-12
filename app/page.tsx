import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { ArrowRight, Sparkles, Zap, Radar } from "lucide-react";
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
    icon: Sparkles,
  },
  {
    title: "Automated Discord Delivery",
    copy: "Link once, get role-synced alerts instantly. Ultimate teams layer custom rules without managing bots.",
    icon: Zap,
  },
  {
    title: "Cross-chain Whale Radar",
    copy: "Bitquery + CoinGecko power curated $20K+ moves. Every embed includes wallet flow, chain and transaction link.",
    icon: Radar,
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
        <div className="relative isolate overflow-hidden">
          <div className="absolute inset-x-0 top-[-200px] h-[500px] blur-[160px] bg-gradient-to-r from-[#00ffa3]/20 via-[#1d4ed8]/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-[-220px] h-[520px] blur-[200px] bg-gradient-to-l from-[#00ffa3]/10 via-[#1d4ed8]/10 to-transparent" />

          <section className="px-6 md:px-12 xl:px-24 pt-24 pb-32">
            <div className="mx-auto grid max-w-[1400px] gap-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] items-center">
              <div className="space-y-9 text-left">
                <span className="inline-flex items-center px-5 py-2 rounded-full text-xs font-semibold tracking-[0.35em] uppercase bg-white/10 text-[#00FFA3] border border-[#00FFA3]/30">
                  Pump.fun traders • Whale watchers • Discord-first teams
                </span>
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-heading font-semibold text-white leading-tight max-w-3xl">
                  React before the curve unlocks. Capture whales the moment they move.
                </h1>
                <p className="text-base md:text-lg text-[#c8d3e3] max-w-xl leading-relaxed">
                  CryptoFlash blends live KOTH telemetry with $20K+ cross-chain whale alerts. No spreadsheets. No bot homebrews.
                  Just actionable flow routed to Discord & X in seconds.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    prefetch={false}
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-xl bg-[#00FFA3] text-[#04121f] font-semibold px-7 py-3 text-sm md:text-base shadow-xl shadow-[#00FFA3]/25 hover:-translate-y-1 transition-transform"
                  >
                    Open KOTH Dashboard
                  </Link>
                  <Link
                    prefetch={false}
                    href="/whale-alerts"
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 text-sm md:text-base text-white px-7 py-3 hover:bg-white/10 transition-colors"
                  >
                    Explore Whale Alerts
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
                      <p className="text-xl font-semibold text-white">{stat.value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#7b8ba5]">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-[#00ffa3]/20 via-transparent to-[#1d4ed8]/10 blur-2xl" />
                <div className="relative rounded-[28px] border border-white/10 bg-[#0d172a]/80 backdrop-blur-xl overflow-hidden">
                  <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#64748b]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00FFA3]" />
                      Latest Whale Push
                    </div>
                    <Link
                      prefetch={false}
                      href="/premium"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#00FFA3] hover:underline"
                    >
                      View pricing & perks
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="px-6 py-6 space-y-5">
                    <p className="text-sm text-[#d1d9e8] leading-relaxed">
                      $482K buy detected on Base. Discord embed includes wallet flow, transaction link and next review window.
                    </p>
                    <div className="grid gap-3 text-sm text-[#94A3B8] sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#64748b] mb-1">Chain</p>
                        <p>Base</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#64748b] mb-1">Route</p>
                        <p>Ultimate Discord + Twitter auto-post</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:col-span-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#64748b] mb-1">Confidence</p>
                        <p>High (3 tracked wallets)</p>
                      </div>
                    </div>
                    <div className="relative rounded-xl border border-white/10 overflow-hidden">
                      <Image
                        src="/images/marketing/discord-whale.png"
                        alt="Discord whale embed preview"
                        width={640}
                        height={360}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="px-6 md:px-12 xl:px-24 py-24">
            <div className="mx-auto grid max-w-[1400px] gap-8 md:grid-cols-3">
              {productPillars.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-white/10 bg-[#071224]/80 p-8 backdrop-blur-sm transition hover:-translate-y-1 hover:border-[#00ffa3]/40"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#00ffa3]/10 text-[#00ffa3]">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-heading text-white">{item.title}</h2>
                  <p className="mt-4 text-sm text-[#b8c5d6] leading-relaxed">{item.copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="px-6 md:px-12 xl:px-24 pb-24">
            <div className="mx-auto max-w-[1400px] rounded-[32px] border border-white/10 bg-[#071224]/80 p-10 md:p-14 space-y-10">
              <div className="max-w-3xl space-y-4">
                <h3 className="text-3xl md:text-4xl font-heading text-white">
                  The workflow high-volume teams rely on
                </h3>
                <p className="text-sm md:text-base text-[#c3cfde] leading-relaxed">
                  CryptoFlash cron jobs fan out every few minutes. Your traders see the right channel at the right time while we
                  handle the integrations, rate-limit math and message formatting.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {workflowHighlights.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-[#0b1628] p-6">
                    <h4 className="text-base font-semibold text-white">{item.title}</h4>
                    <p className="mt-3 text-sm text-[#94A3B8] leading-relaxed">{item.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="px-6 md:px-12 xl:px-24 pb-28">
            <div className="mx-auto max-w-[1200px] rounded-[32px] border border-[#00FFA3]/25 bg-gradient-to-br from-[#00ffa3]/15 via-[#00ffa3]/10 to-transparent p-12 text-center space-y-8">
              <h3 className="text-3xl md:text-4xl font-heading text-white">Ready to level up your signal?</h3>
              <p className="text-sm md:text-base text-[#0b2335]/80 md:max-w-2xl mx-auto leading-relaxed">
                Join traders who automate KOTH unlocks, cross-chain whale flows and premium Discord delivery with CryptoFlash.
                Pick the plan that fits your runway and start receiving alerts in under two minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  prefetch={false}
                  href="/premium"
                  className="inline-flex items-center justify-center rounded-xl bg-[#04121f] text-white px-7 py-3 text-sm md:text-base font-semibold hover:bg-[#04121f]/80 transition-colors"
                >
                  View Premium Plans
                </Link>
                <Link
                  prefetch={false}
                  href="/faq"
                  className="inline-flex items-center justify-center rounded-xl border border-[#04121f]/30 text-sm md:text-base text-[#04121f] px-7 py-3 hover:bg-white/20 transition-colors"
                >
                  Read the FAQ
                </Link>
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#04121f]/70">
                Free tier available • Discord + Twitter automations included
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
