import { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'

export const metadata: Metadata = {
  title: 'Blog | CryptoFlash Playbooks & KOTH Strategies',
  description: 'Deep-dives on KOTH progression, sniper workflows and Solana bonding-curve economics. Learn how to extract signal from CryptoFlash and trade smarter.',
  keywords: 'KOTH strategy, Solana bonding curve, CryptoFlash guides, memecoin sniper workflow, alerts tutorial',
  openGraph: {
    title: 'CryptoFlash Blog – KOTH Playbooks & Sniper Workflows',
    description: 'Learn how to master KOTH progression, configure sniper alerts and understand Solana bonding curves with CryptoFlash.',
    url: `${siteUrl}/blog`,
    type: 'website',
  },
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
}

// Blog posts data (will be moved to CMS or database later)
const blogPosts = [
  {
    slug: 'koth-progression-playbook',
    title: 'KOTH Progression Playbook: Reading Solana Bonding Curves',
    description: 'Learn how to interpret bonding-curve progress, spot confidence signals and react before a token graduates to open liquidity.',
    date: '2024-11-06',
    readTime: '6 min read',
  },
  {
    slug: 'cryptoflash-sniper-workflow',
    title: 'CryptoFlash Sniper Workflow: Alerts, Scores & Execution',
    description: 'Step-by-step workflow for configuring alerts, using AI Snipe Score and executing trades with discipline.',
    date: '2024-11-05',
    readTime: '7 min read',
  },
  {
    slug: 'solana-bonding-curve-economics',
    title: 'Solana Bonding Curve Economics Explained',
    description: 'Understand how bonding curves price liquidity, why KOTH matters and how CryptoFlash models the curve.',
    date: '2024-11-04',
    readTime: '6 min read',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            CryptoFlash Blog
          </h1>
          <p className="text-lg text-[#b8c5d6] leading-relaxed">
            Playbooks for traders who rely on CryptoFlash. Master KOTH progression, fine-tune sniper alerts and build conviction with real data.
          </p>
        </div>

        {/* Blog Posts List */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="glass-card rounded-xl p-6 hover:scale-105 transition-transform duration-300 hover:border-[#00FFA3]/30"
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-[#F8FAFC] mb-2 hover:text-[#00FFA3] transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-[#94A3B8] mb-4 line-clamp-3">
                  {post.description}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-[#6b7280]">
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <p className="text-[#94A3B8]">
            More guides coming soon! Check back for updates.
          </p>
        </div>
      </main>
    </div>
  )
}

