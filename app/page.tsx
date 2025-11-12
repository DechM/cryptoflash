import Link from "next/link";
import { Metadata } from "next";
import { Sparkles, Zap, Radar } from "lucide-react";
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

const heroBullets = [
  "Track bonding-curve progress, AI Snipe Score and velocity without spreadsheets.",
  "Automate Discord/X posts seconds after a whale move is detected.",
  "Role-aware delivery keeps public users in public channels while premium teams see the full signal.",
];

const productPillars = [
  {
    title: "Live KOTH Telemetry",
    copy: "Watch progress, velocity and liquidity for each curve. Spot which tokens are climbing toward KOTH before they break out.",
    icon: Sparkles,
  },
  {
    title: "Automated Discord Delivery",
    copy: "One link and you're live. Roles stay synced automatically so Ultimate teams can stack rules without bot maintenance.",
    icon: Zap,
  },
  {
    title: "Cross-chain Whale Radar",
    copy: "Bitquery + CoinGecko power curated $20K+ moves with wallet flow, chain callouts and direct transaction links.",
    icon: Radar,
  },
];

const workflowHighlights = [
  {
    title: "Hourly token refresh",
    details: "CoinGecko + Bitquery keep the token list fresh every hour—no rate-limit surprises, no manual CSV juggling.",
  },
  {
    title: "Role-aware routing",
    details: "Discord roles stay synced automatically. No duplicate bots, no missed premium channel access.",
  },
  {
    title: "Twitter-ready threads",
    details: "Dynamic hooks for X keep every post fresh—no duplicate copy, no compliance headaches.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen w-screen flex flex-col bg-[#050B18]">
      <MarketingNavbar />

      <main className="w-screen min-h-screen overflow-x-hidden pt-[calc(var(--nav-height)+4px)] md:pt-[calc(var(--nav-height)+18px)]">
        <section className="relative w-full px-6 md:px-12 xl:px-24 pb-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-r from-[#00ffa3]/15 via-transparent to-[#1d4ed8]/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-[-240px] h-[480px] bg-gradient-to-l from-[#1d4ed8]/20 via-transparent to-[#00ffa3]/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8">
            <span className="inline-flex items-center px-5 py-2 rounded-full text-xs font-semibold tracking-[0.35em] uppercase bg-white/10 text-[#00FFA3] border border-[#00FFA3]/30">
              Pump.fun traders • Whale watchers • Discord-first teams
            </span>
            <div className="space-y-6">
              <h1 className="text-[9vw] sm:text-4xl md:text-6xl xl:text-7xl font-heading font-semibold text-white leading-tight">
                React before the curve unlocks. Capture whales the moment they move.
              </h1>
              <p className="text-base md:text-lg text-[#c8d3e3] leading-relaxed tracking-wide max-w-prose">
                CryptoFlash blends live KOTH telemetry with cross-chain whale alerts and automated Discord/X delivery. No bot
                juggling. Just signal when it matters.
              </p>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-[#9fb0c9] leading-relaxed tracking-wide">
                {heroBullets.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#00ffa3]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative z-20 flex flex-wrap gap-3">
              <Link
                prefetch={false}
                href="/premium"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-[#00FFA3] text-[#04121f] font-semibold px-6 py-3 text-sm md:text-base shadow-xl shadow-[#00FFA3]/25 hover:-translate-y-0.5 transition-transform focus:outline-none focus:ring-2 focus:ring-[#00ffa3] focus:ring-offset-0"
              >
                View Premium Plans
              </Link>
              <Link
                prefetch={false}
                href="/whale-alerts"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 text-sm md:text-base text-white px-6 py-3 hover:bg-white/10 transition-colors"
              >
                Explore Whale Alerts
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 [&>div]:h-20 md:[&>div]:h-24">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
                  <p className="text-xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#7b8ba5]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full px-6 md:px-12 xl:px-24 py-20">
          <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 xl:gap-10">
            {productPillars.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur transition hover:-translate-y-1 hover:border-[#00ffa3]/40"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#00ffa3]/10 text-[#00ffa3]">
                  <item.icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-heading text-white">{item.title}</h2>
                <p className="mt-4 text-sm text-[#b8c5d6] leading-relaxed tracking-wide">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full px-6 md:px-12 xl:px-24 py-24 bg-[#041021]">
          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <h3 className="text-3xl md:text-4xl font-heading text-white">
                The workflow high-volume teams rely on
              </h3>
              <p className="text-sm md:text-base text-[#c3cfde] leading-relaxed tracking-wide max-w-prose">
                CryptoFlash cron jobs fan out every few minutes. Your team sees the right channel at the right time while we
                handle integrations, rate-limit math and message formatting.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {workflowHighlights.map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
                  <h4 className="text-base font-semibold text-white">{item.title}</h4>
                  <p className="mt-3 text-sm text-[#94A3B8] leading-relaxed tracking-wide">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full px-6 md:px-12 xl:px-24 py-24">
          <div className="relative rounded-[32px] border border-[#00FFA3]/25 bg-gradient-to-br from-[#00ffa3]/12 via-[#00ffa3]/8 to-transparent px-6 py-10 md:px-12 md:py-14 text-center space-y-6 md:space-y-8">
            <h3 className="text-3xl md:text-4xl font-heading text-white">Ready to level up your signal?</h3>
            <p className="text-sm md:text-base text-[#0b2335]/80 leading-relaxed tracking-wide max-w-prose mx-auto">
              Join the traders automating KOTH unlocks, cross-chain whale flows and premium Discord delivery with CryptoFlash.
              Pick a plan and get signals in under two minutes.
            </p>
            <div className="relative z-20 flex flex-wrap justify-center gap-4">
              <Link
                prefetch={false}
                href="/premium"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-[#04121f] text-white px-6 py-3 text-sm md:text-base font-semibold hover:bg-[#04121f]/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#04121f] focus:ring-offset-0"
              >
                View Premium Plans
              </Link>
              <Link
                prefetch={false}
                href="/faq"
                className="inline-flex items-center justify-center rounded-xl border border-[#04121f]/20 bg-white/80 text-sm md:text-base text-[#04121f] px-6 py-3 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#04121f]/40 focus:ring-offset-0"
              >
                Read the FAQ
              </Link>
            </div>
            <p className="relative z-20 text-xs uppercase tracking-[0.3em] text-[#04121f]/70">
              Free tier available • Discord + Twitter automations included
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
