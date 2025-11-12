"use client";

import Link from "next/link";
import Script from "next/script";
import { Crown, ShieldCheck, BellRing, Activity } from "lucide-react";

import PlanCards from "@/components/billing/PlanCards";
import { Navbar } from "@/components/Navbar";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://cryptoflash.app").replace(/\/$/, "")

export default function PremiumPage() {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "CryptoFlash Premium Plans",
    "description": "Subscription plans for CryptoFlash alerts, including Pro and Ultimate tiers for KOTH tracking and cross-chain whale alerts.",
    "url": `${siteUrl}/premium`,
    "brand": {
      "@type": "Brand",
      "name": "CryptoFlash"
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Pro Plan",
        "price": "19.99",
        "priceCurrency": "USDC",
        "availability": "https://schema.org/InStock",
        "url": `${siteUrl}/premium`,
        "description": "Early KOTH alerts, faster refresh intervals and premium analytics."
      },
      {
        "@type": "Offer",
        "name": "Ultimate Plan",
        "price": "39.99",
        "priceCurrency": "USDC",
        "availability": "https://schema.org/InStock",
        "url": `${siteUrl}/premium`,
        "description": "Everything from Pro plus Whale Alerts, Discord roles and priority features."
      }
    ]
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Premium", "item": `${siteUrl}/premium` }
    ]
  }

  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <Navbar />

      <Script
        id="premium-product-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productSchema, breadcrumbSchema])
        }}
      />

      <main className="w-screen flex-1">
        <div className="w-screen space-y-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Crown className="h-16 w-16 text-[#ffd700]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-semibold text-white">
              Pricing for KOTH Snipers & Whale Watchers
            </h1>
            <p className="text-base md:text-xl text-[#b8c5d6]">
              Pick the CryptoFlash plan that matches your trading stack. Upgrade to unlock earlier KOTH alerts, cross-chain whale notifications and premium analytics.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-[#94A3B8]">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#00FFA3]" />
                Solana Pay billing
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                <BellRing className="h-4 w-4 text-[#00D1FF]" />
                Discord-first delivery
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#facc15]" />
                Live analytics dashboard
              </span>
            </div>
          </div>

          <div>
            <PlanCards />
          </div>

          <section className="grid gap-8 md:grid-cols-2">
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h2 className="text-xl md:text-2xl font-heading text-white">
                KOTH alerts tuned for every plan
              </h2>
              <p className="text-[#b8c5d6]">
                Free users get late-stage confirmations at 95% score. Pro unlocks alerts at 85% and faster refresh intervals,
                while Ultimate fires as early as 80% with whale flow context. Manage your rules in{" "}
                <Link prefetch={false} href="/alerts" className="text-[#00FFA3] hover:underline">
                  Alerts &gt; Manage
                </Link>.
              </p>
              <ul className="space-y-2 text-sm text-[#94A3B8]">
                <li>• Customize thresholds per token or watchlist</li>
                <li>• Discord-first delivery with role tagging</li>
                <li>• Export history for journaling and review</li>
              </ul>
            </div>

            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h2 className="text-xl md:text-2xl font-heading text-white">
                Add Whale Alerts when you need flow
              </h2>
              <p className="text-[#b8c5d6]">
                Ultimate includes real-time cross-chain whale tracking. Get embeds for every $20K+ transfer across supported networks and auto-posts to Twitter/X. See a live preview on{" "}
                <Link prefetch={false} href="/whale-alerts" className="text-[#00FFA3] hover:underline">
                  Whale Alerts
                </Link>.
              </p>
              <ul className="space-y-2 text-sm text-[#94A3B8]">
                <li>• Discord channel with premium embeds</li>
                <li>• Automated hype tweets with dynamic hooks</li>
                <li>• Chain + flow breakdown for quick decisions</li>
              </ul>
            </div>
          </section>

          <section className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
            <h2 className="text-xl md:text-2xl font-heading text-white">
              Need help picking a plan?
            </h2>
            <p className="text-[#b8c5d6]">
              Read our{" "}
              <Link prefetch={false} href="/blog/cryptoflash-sniper-workflow" className="text-[#00FFA3] hover:underline">
                CryptoFlash Sniper Workflow guide
              </Link>{" "}
              or{" "}
              <Link prefetch={false} href="/contact" className="text-[#00FFA3] hover:underline">
                contact us
              </Link>{" "}
              for tailored onboarding. We help teams set up playbooks, Discord routing and alert hygiene.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

