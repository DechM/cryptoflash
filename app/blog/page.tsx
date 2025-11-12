import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { MarketingNavbar } from '@/components/MarketingNavbar'
import postsModule from './posts'
import type { BlogPost } from './posts'

const rawPosts = postsModule as unknown

let blogPosts: BlogPost[] = []

if (Array.isArray(rawPosts)) {
  blogPosts = rawPosts as BlogPost[]
} else if (rawPosts && typeof rawPosts === 'object') {
  const candidates = rawPosts as { blogPosts?: BlogPost[]; default?: BlogPost[] }
  if (Array.isArray(candidates.blogPosts)) {
    blogPosts = candidates.blogPosts
  } else if (Array.isArray(candidates.default)) {
    blogPosts = candidates.default
  }
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'

export const metadata: Metadata = {
  title: 'Blog | CryptoFlash Playbooks & KOTH Strategies',
  description:
    'Deep-dives on KOTH progression, sniper workflows and Solana bonding-curve economics. Learn how to extract signal from CryptoFlash and trade smarter.',
  keywords: 'KOTH strategy, Solana bonding curve, CryptoFlash guides, memecoin sniper workflow, alerts tutorial',
  openGraph: {
    title: 'CryptoFlash Blog – KOTH Playbooks & Sniper Workflows',
    description:
      'Learn how to master KOTH progression, configure sniper alerts and understand Solana bonding curves with CryptoFlash.',
    url: `${siteUrl}/blog`,
    type: 'website'
  },
  alternates: {
    canonical: `${siteUrl}/blog`
  }
}

export default function BlogPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${siteUrl}/blog` }
    ]
  }

  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <MarketingNavbar />

      <Script
        id="blog-breadcrumb-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <main className="w-screen flex-1">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4 font-heading">
            CryptoFlash Blog
          </h1>
          <p className="text-lg text-[#b8c5d6] leading-relaxed">
            Playbooks for traders who rely on CryptoFlash. Master KOTH progression, fine-tune sniper alerts and build conviction with real data.
          </p>
          <p className="text-sm text-[#94A3B8] mt-3">
            Looking for live data? Hop over to our{' '}
            <Link prefetch={false} href="/whale-alerts" className="text-[#00FFA3] hover:underline">
              Whale Alerts feed
            </Link>{' '}
            or{' '}
            <Link prefetch={false} href="/dashboard" className="text-[#00FFA3] hover:underline">
              KOTH dashboard
            </Link>{' '}
            and plug these playbooks into action.
          </p>
        </div>

        {/* Blog Posts List */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {blogPosts.map((post) => (
            <Link prefetch={false}
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="glass-card rounded-xl p-6 hover:scale-105 transition-transform duration-300 hover:border-[#00FFA3]/30"
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-[#F8FAFC] mb-2 hover:text-[#00FFA3] transition-colors font-heading">
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

