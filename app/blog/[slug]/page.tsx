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
  'what-is-koth-complete-guide': {
    title: 'What is KOTH? Complete Guide to King of the Hill on Pump.fun',
    description: 'Learn everything about KOTH (King of the Hill) on Pump.fun. Understand bonding curves, when tokens hit KOTH, and how to track them early.',
    date: '2024-11-06',
    readTime: '5 min read',
    content: `
# What is KOTH? Complete Guide to King of the Hill on Pump.fun

KOTH (King of the Hill) is a critical milestone for tokens launched on Pump.fun. Understanding KOTH is essential for successful memecoin trading.

## What is KOTH?

KOTH stands for "King of the Hill" and represents the moment when a Pump.fun token reaches **100% bonding curve progress**. This is when the token transitions from the bonding curve phase to full liquidity on Raydium.

## How Bonding Curves Work

Pump.fun uses a bonding curve mechanism:

1. **Token Launch**: Token starts at 0% progress
2. **Bonding Curve Phase**: As people buy, progress increases (0-100%)
3. **KOTH (100%)**: Token reaches full liquidity
4. **Raydium Listing**: Token is now tradeable on DEX

## Why KOTH Matters

- **Price Discovery**: KOTH is when real price discovery happens
- **Liquidity**: Full liquidity is unlocked
- **Volume**: Trading volume typically spikes
- **Opportunity**: Early detection = better entry prices

## How to Track KOTH

CryptoFlash provides real-time KOTH tracking:

- **Early Alerts**: Get notified at 69%+ progress
- **Live Dashboard**: See all tokens approaching KOTH
- **AI Snipe Score**: Quality score (0-100) for each token
- **Progress Tracking**: Real-time bonding curve progress

## Best Practices

1. **Track Early**: Monitor tokens at 69%+ progress
2. **Check Score**: Look for tokens with score > 75
3. **Set Alerts**: Use automated alerts for your favorite tokens
4. **Monitor Volume**: High volume = more interest

## Conclusion

KOTH is a crucial moment for Pump.fun tokens. By tracking KOTH early (69%+ progress), you can position yourself before the token moons.

**Start tracking KOTH now**: [cryptoflash.app/dashboard](/dashboard)
    `.trim(),
  },
  'how-to-snipe-pump-fun-tokens-early': {
    title: 'How to Snipe Pump.fun Tokens Early: KOTH Tracker Guide',
    description: 'Master the art of early detection on Pump.fun. Learn how to use KOTH tracker to find tokens before they moon.',
    date: '2024-11-05',
    readTime: '7 min read',
    content: `
# How to Snipe Pump.fun Tokens Early: KOTH Tracker Guide

Early detection is the key to successful memecoin trading. This guide shows you how to snipe Pump.fun tokens before they moon.

## Why Early Detection Matters

- **Better Entry Price**: Buy before price pumps
- **Higher Profit Potential**: Early entry = more gains
- **Less Competition**: Fewer people know about it
- **Time Advantage**: More time to research

## Using KOTH Tracker

CryptoFlash tracks tokens at **69%+ progress**, giving you 8-15 minutes before KOTH.

### Step 1: Monitor Dashboard

Visit the [live dashboard](/dashboard) to see:
- Real-time bonding curve progress
- AI Snipe Score (quality indicator)
- Whale activity
- Volume trends

### Step 2: Set Alerts

Configure alerts for:
- **Progress Threshold**: 69%+ (early signal)
- **Score Threshold**: 72+ (quality filter)
- **Multiple Tokens**: Diversify your alerts

### Step 3: Analyze Before Buying

Before buying, check:
- ✅ AI Snipe Score (higher = better)
- ✅ Progress (closer to 100% = more urgent)
- ✅ Whale activity (whales = confidence)
- ✅ Volume (high volume = interest)

## Pro Tips

1. **Track Multiple Tokens**: Don't put all eggs in one basket
2. **Use Score Filter**: Focus on tokens with score > 75
3. **Set Early Alerts**: 69%+ progress is the sweet spot
4. **Monitor Success Rate**: Track which alerts hit KOTH

## Conclusion

Early detection is everything in memecoin trading. Use KOTH tracker to get ahead of the crowd.

**Start sniping now**: [cryptoflash.app/dashboard](/dashboard)
    `.trim(),
  },
  'pump-fun-bonding-curve-explained': {
    title: 'Pump.fun Bonding Curve Explained: When to Buy',
    description: 'Understand Pump.fun bonding curves, progress tracking, and optimal entry points for maximum profits.',
    date: '2024-11-04',
    readTime: '6 min read',
    content: `
# Pump.fun Bonding Curve Explained: When to Buy

Understanding bonding curves is essential for successful Pump.fun trading.

## What is a Bonding Curve?

A bonding curve is a mathematical formula that determines token price based on supply. As more tokens are bought, the price increases.

## How Pump.fun Bonding Curves Work

1. **0-100% Progress**: Token is in bonding curve phase
2. **Price Increases**: Each buy increases the price
3. **100% = KOTH**: Token reaches full liquidity
4. **Raydium Listing**: Token is now on DEX

## When to Buy

### Early Entry (0-50% Progress)
- ✅ Lowest price
- ✅ Highest risk (token might not reach KOTH)
- ⚠️ Requires patience

### Mid Entry (50-80% Progress)
- ✅ Moderate price
- ✅ Lower risk (token likely to hit KOTH)
- ✅ Good balance

### Late Entry (80-100% Progress)
- ⚠️ Higher price
- ✅ Lowest risk (almost at KOTH)
- ⚠️ Less profit potential

## Optimal Strategy

**Best Entry Point: 69-85% Progress**

- Early enough for good entry price
- Late enough to confirm token quality
- Sweet spot for risk/reward

## Using CryptoFlash

Track bonding curve progress in real-time:
- See exact progress percentage
- Monitor price changes
- Get alerts at optimal entry points

## Conclusion

Understanding bonding curves helps you time your entries perfectly. Track progress and buy at optimal points.

**Track bonding curves now**: [cryptoflash.app/dashboard](/dashboard)
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
              if (line.startsWith('- ') || line.startsWith('✅ ') || line.startsWith('⚠️ ')) {
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

