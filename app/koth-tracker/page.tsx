import Link from 'next/link'

import { Navbar } from '@/components/Navbar'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app').replace(/\/$/, '')

export const metadata = {
  title: 'KOTH Tracker | Real-time Pump.fun Dashboard | CryptoFlash',
  description:
    'Monitor Pump.fun King of the Hill trajectories in real time. CryptoFlash KOTH Tracker highlights progress, AI Snipe Scores, liquidity, whale flow and speed so you can enter before the unlock.',
  alternates: {
    canonical: `${siteUrl}/koth-tracker`,
  },
}

const benefits = [
  {
    title: 'Live bonding-curve telemetry',
    body: 'See progress, liquidity, volume and AI Snipe Score update automatically. Spot acceleration before the final push and avoid exhausted curves.',
  },
  {
    title: 'Early alerts built in',
    body: (
      <>
        Connect your <Link prefetch={false} href="/alerts" className="text-[#00FFA3] hover:underline">Alerts</Link> rules to get notified
        when scores cross 95/85/80 thresholds based on your plan. Export alert history to review each trade.
      </>
    ),
  },
  {
    title: 'Whale flow context',
    body: (
      <>
        Layer <Link prefetch={false} href="/whale-alerts" className="text-[#00FFA3] hover:underline">Whale Alerts</Link> to validate demand
        before entering. Ultimate members see cross-chain whale embeds and curated X/Twitter posts.
      </>
    ),
  },
]

export default function KothTrackerPage() {
  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <Navbar />

      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-10">
        <div className="max-w-5xl mx-auto space-y-12">
          <section className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-heading font-semibold text-white">
              Real-time Pump.fun KOTH Tracker
            </h1>
            <p className="text-base md:text-xl text-[#b8c5d6] max-w-3xl mx-auto">
              CryptoFlash surfaces every Pump.fun King of the Hill candidate with live scores, liquidity and whale flow.
              Anticipate the unlock, time entries with confidence and export your data for review.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-[#94A3B8]">
              <Link prefetch={false} href="/premium" className="px-4 py-2 rounded-lg bg-[#00FFA3]/20 border border-[#00FFA3]/40 text-[#00FFA3] hover:bg-[#00FFA3]/30 transition-colors">
                View plans
              </Link>
              <Link prefetch={false} href="/dashboard" className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors">
                Open dashboard
              </Link>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="glass-card rounded-2xl p-6 space-y-3">
              <h2 className="text-lg md:text-xl font-heading text-white">Why KOTH tracking matters</h2>
              <p className="text-sm md:text-base text-[#b8c5d6]">
                Pump.fun curves move fast. By tracking progress, speed and whale inflow you can spot the next unlock before it reaches the crowd.
                Pair dashboard insights with your alerts and journaling workflow for consistent execution.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-6 space-y-3">
              <h2 className="text-lg md:text-xl font-heading text-white">Flexible data exports & automation</h2>
              <p className="text-sm md:text-base text-[#b8c5d6]">
                Premium members can export CSV snapshots, monitor leaderboards and even connect the CryptoFlash API (coming soon) to automate personal dashboards.
              </p>
            </div>
          </section>

          <section className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl md:text-2xl font-heading text-white">What you get inside the dashboard</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {benefits.map(item => (
                <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-lg font-heading text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-[#b8c5d6]">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
            <h2 className="text-xl md:text-2xl font-heading text-white">Next steps</h2>
            <p className="text-sm md:text-base text-[#b8c5d6]">
              New to KOTH sniping? Start with our{' '}
              <Link prefetch={false} href="/blog/koth-progression-playbook" className="text-[#00FFA3] hover:underline">
                KOTH Progression Playbook
              </Link>{' '}
              and{' '}
              <Link prefetch={false} href="/blog/cryptoflash-sniper-workflow" className="text-[#00FFA3] hover:underline">
                Sniper Workflow guide
              </Link>. When you are ready, upgrade on{' '}
              <Link prefetch={false} href="/premium" className="text-[#00FFA3] hover:underline">
                CryptoFlash Pricing
              </Link>{' '}
              and configure your personal alert rules in{' '}
              <Link prefetch={false} href="/alerts" className="text-[#00FFA3] hover:underline">
                Alerts &gt; Manage
              </Link>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}


