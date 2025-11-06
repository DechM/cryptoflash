import { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'

export const metadata: Metadata = {
  title: 'Blog | KOTH Tracker Guides & Pump.fun Tips | CryptoFlash',
  description: 'Learn how to use KOTH tracker, understand bonding curves, snipe Pump.fun tokens early, and maximize profits. Complete guides and tutorials.',
  keywords: 'pump.fun guide, KOTH tracker tutorial, bonding curve explained, how to snipe memecoins, Solana memecoin strategy, pump.fun tips',
  openGraph: {
    title: 'CryptoFlash Blog - KOTH Tracker Guides & Tips',
    description: 'Learn how to use KOTH tracker and snipe Pump.fun tokens early with our complete guides.',
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
    slug: 'what-is-koth-complete-guide',
    title: 'What is KOTH? Complete Guide to King of the Hill on Pump.fun',
    description: 'Learn everything about KOTH (King of the Hill) on Pump.fun. Understand bonding curves, when tokens hit KOTH, and how to track them early.',
    date: '2024-11-06',
    readTime: '5 min read',
  },
  {
    slug: 'how-to-snipe-pump-fun-tokens-early',
    title: 'How to Snipe Pump.fun Tokens Early: KOTH Tracker Guide',
    description: 'Master the art of early detection on Pump.fun. Learn how to use KOTH tracker to find tokens before they moon.',
    date: '2024-11-05',
    readTime: '7 min read',
  },
  {
    slug: 'pump-fun-bonding-curve-explained',
    title: 'Pump.fun Bonding Curve Explained: When to Buy',
    description: 'Understand Pump.fun bonding curves, progress tracking, and optimal entry points for maximum profits.',
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
            Learn how to use KOTH tracker, understand bonding curves, and snipe Pump.fun tokens early.
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

