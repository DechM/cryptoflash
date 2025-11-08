import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'

// Blog posts content (will be moved to CMS or markdown files later)
const blogPosts: Record<string, {
  title: string
  description: string
  content: string
  date: string
  readTime: string
}> = {
  'koth-progression-playbook': {
    title: 'KOTH Progression Playbook: Reading Solana Bonding Curves',
    description: 'Learn how to interpret bonding-curve progress, spot confidence signals and react before a token graduates to open liquidity.',
    date: '2024-11-06',
    readTime: '6 min read',
    content: `
# KOTH Progression Playbook: Reading Solana Bonding Curves

Solana bonding-curve launchpads all share a similar lifecycle: tokens move from 0% progress to a "King of the Hill" (KOTH) moment where liquidity becomes permissionless. Traders who can read the curve earlier enjoy better entries and more time to validate the narrative. This playbook shows how to translate raw numbers in CryptoFlash into confident decisions.

## Why Progress Percentage Matters
- **Market readiness**: Progress is a proxy for how much capital has already committed to the token.
- **Risk ladder**: Lower progress = cheaper entry but more failure risk; higher progress = tighter window but higher completion odds.
- **Execution planning**: Knowing where a curve sits determines whether you should research, scale in, or simply monitor.

## Stage Breakdown
1. **Discovery (0-40%)** – Idea still forming. Focus on narratives and creator credibility.
2. **Validation (40-70%)** – Liquidity starts to mean something. Watch AI Snipe Score momentum and whale lookups.
3. **Acceleration (70-90%)** – Crowded zone. Progress velocity and wallet concentration decide if it finishes.
4. **Final Push (90-100%)** – Countdown to open liquidity. Execution becomes a timing game.

## Signals to Monitor in CryptoFlash
### Velocity of Progress
Large percentage jumps in short intervals signal coordinated demand. Use the dashboard refresh timestamps to judge whether the curve is drifting or surging.

### Liquidity & Volume Context
Combine progress with liquidity in USD. A token at 85% with thin liquidity is fragile; one with deep liquidity suggests committed capital.

### Wallet Composition
Tap the Whale Alerts feed to see if smart money is touching the curve. Multiple whale pings near 70%+ progress often precede a quick finish.

## How to React Inside CryptoFlash
- **Dashboard filters** highlight progress bands (e.g. 70-90%). Snapshot tokens that repeatedly sit near the top.
- **AI Snipe Score overlays** convert dozens of metrics into a 0-100 grade so you can rank plays even if progress is similar.
- **Watchlist + alerts** let you pin curves and get push notifications as soon as the progress threshold you trust is breached.

## Decision Checklist
1. Progress velocity supports a finish?
2. Liquidity and volume scale with progress?
3. Whale or community signals present?
4. Narrative still intact on socials/Discord?
5. Entry plan and exit plan defined in advance?

If you can tick all boxes, you are acting with a structured thesis instead of chasing green candles.

## Stay Data-Driven
The KOTH race is emotional for the crowd but mechanical for disciplined traders. Let CryptoFlash provide the telemetry so you can stay objective and position before the liquidity unlock.

**Monitor the latest KOTH trajectories → [Open the dashboard](/dashboard)**
    `.trim(),
  },
  'cryptoflash-sniper-workflow': {
    title: 'CryptoFlash Sniper Workflow: Alerts, Scores & Execution',
    description: 'Step-by-step workflow for configuring alerts, using AI Snipe Score and executing trades with discipline.',
    date: '2024-11-05',
    readTime: '7 min read',
    content: `
# CryptoFlash Sniper Workflow: Alerts, Scores & Execution

Great entries are rarely about luck—they are the result of a repeatable workflow. This guide walks through a battle-tested process that CryptoFlash power users rely on every day.

## 1. Build a Focused Universe
- Start with the **Trending** section plus personal narrative watchlists.
- Tag tokens that match your thesis (e.g. gaming, AI, community memes).
- Use the watchlist to declutter the dashboard and focus only on high-conviction ideas.

## 2. Configure Alerts Intentionally
- **Progress Alerts**: Free plan alerts fire at 95%; Pro drops to 85%; Ultimate reaches 80%. Match the threshold to your risk appetite.
- **Score Filters**: Set minimum AI Snipe Score (e.g. 74+) so only quality setups ping.
- **Quantity Limits**: Remember plan caps—balance the number of active alerts with your ability to monitor them.

## 3. Interpret the Alert Payload
When the alert fires, cross-check:
- Current progress versus historic velocity.
- Score trend (is it climbing or fading?).
- Whale activity and liquidity snapshot.

If one of those datapoints contradicts your plan, stand down. Alerts are a decision point, not an obligation to buy.

## 4. Execute With Discipline
- Use limit orders where possible—late-stage curves move quickly.
- Size positions according to conviction and liquidity. Avoid overexposure to one narrative.
- Set exit criteria (target multiple, time-based exit, or score deterioration) before entering.

## 5. Review & Iterate
Maintain a simple trade journal:
- Alert time vs. entry time
- Progress & score at entry
- Outcome and lessons learned

Reviewing 10-20 trades will quickly highlight whether your thresholds are too tight or too loose.

## Bonus: Combine With Whale Alerts
Ultimate users can layer the Whale Alerts channel to catch sudden large buys that confirm an alert. When both fire close together, momentum is typically strong.

**Ready to put the workflow into action? → [Configure your alerts](/alerts)**
    `.trim(),
  },
  'solana-bonding-curve-economics': {
    title: 'Solana Bonding Curve Economics Explained',
    description: 'Understand how bonding curves price liquidity, why KOTH matters and how CryptoFlash models the curve.',
    date: '2024-11-04',
    readTime: '6 min read',
    content: `
# Solana Bonding Curve Economics Explained

Bonding-curve launchpads were designed to decentralize fundraising, but they also create predictable price behaviour. Grasping the math behind the curve helps you time entries and exits with more confidence.

## The Curve in Plain English
- Price starts extremely low and increases with each buy.
- Supply is fixed during the curve phase; liquidity grows alongside price.
- At 100% progress (KOTH), the pool migrates to an open DEX and price discovery becomes public.

## Key Economic Forces
### 1. Early Price Elasticity
Small buys move the curve dramatically. Traders here chase asymmetric upside but face high failure risk.

### 2. Mid-Curve Stability
Liquidity deepens, spreads tighten and organic communities either form or fade. This is where most disciplined traders begin sizing in.

### 3. Late-Curve Momentum
Fear of missing out plus accumulation by larger wallets accelerates progress. Slippage increases—plan your execution carefully.

## Why KOTH Is a Critical Checkpoint
- **Liquidity Unlock**: Market makers can participate, reducing slippage.
- **Narrative Validation**: Surviving the entire curve signals strong community demand.
- **Volatility Spike**: Newly unlocked liquidity attracts both momentum traders and profit takers.

## How CryptoFlash Models the Curve
- **Progress %** acts as the primary axis.
- **AI Snipe Score** blends velocity, liquidity depth, holder concentration and social traction.
- **Historical analytics** let you compare a token’s path vs. previous successful curves.

## Practical Takeaways
1. Treat early entries as venture bets and size accordingly.
2. Focus on the 65-85% zone if you prefer balanced risk/reward.
3. Use data (velocity, score, whale flow) to validate each step.
4. Plan exits around the KOTH unlock—volatility is guaranteed.

## Continue Exploring
CryptoFlash condenses curve economics into actionable dashboards so you can make faster, smarter calls without refreshing ten different tabs.

**Explore bonding curve analytics → [Visit the dashboard](/dashboard)**
    `.trim(),
  },
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = blogPosts[params.slug]
  
  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: `${post.title} | CryptoFlash Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${siteUrl}/blog/${params.slug}`,
      type: 'article',
      publishedTime: post.date,
    },
    alternates: {
      canonical: `${siteUrl}/blog/${params.slug}`,
    },
  }
}

export function generateStaticParams() {
  return Object.keys(blogPosts).map(slug => ({ slug }))
}

export const dynamicParams = false

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts[params.slug]

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-[#00FFA3] hover:text-[#00D1FF] mb-8 transition-colors"
        >
          ← Back to Blog
        </Link>

        {/* Article Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-[#94A3B8] mb-6">
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Article Content */}
        <article className="glass-card rounded-xl p-6 md:p-8 prose prose-invert prose-headings:text-[#F8FAFC] prose-p:text-[#b8c5d6] prose-a:text-[#00FFA3] prose-strong:text-[#F8FAFC] max-w-none">
          <div className="markdown-content whitespace-pre-wrap">
            {post.content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return <h1 key={i} className="text-3xl font-bold text-[#F8FAFC] mt-8 mb-4">{line.slice(2)}</h1>
              }
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-2xl font-bold text-[#F8FAFC] mt-6 mb-3">{line.slice(3)}</h2>
              }
              if (line.startsWith('### ')) {
                return <h3 key={i} className="text-xl font-bold text-[#F8FAFC] mt-4 mb-2">{line.slice(4)}</h3>
              }
              if (line.startsWith('- ')) {
                return <li key={i} className="text-[#b8c5d6] mb-2 ml-4">{line.slice(2)}</li>
              }
              if (line.startsWith('✅ ') || line.startsWith('⚠️ ')) {
                return <li key={i} className="text-[#b8c5d6] mb-2 ml-4">{line}</li>
              }
              if (line.trim() === '') {
                return <br key={i} />
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} className="text-[#b8c5d6] mb-4"><strong className="text-[#F8FAFC]">{line.slice(2, -2)}</strong></p>
              }
              return <p key={i} className="text-[#b8c5d6] mb-4">{line}</p>
            })}
          </div>
        </article>

        {/* CTA */}
        <div className="mt-12 text-center glass-card rounded-xl p-6">
          <h2 className="text-2xl font-bold text-[#F8FAFC] mb-4">
            Ready to Start Tracking KOTH?
          </h2>
          <Link
            href="/dashboard"
            className="btn-cta-upgrade inline-block"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}

