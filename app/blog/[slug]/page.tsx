import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'

import { MarketingNavbar } from '@/components/MarketingNavbar'
import postsModule from '../posts'
import type { BlogPost } from '../posts'

type BlogParams = { slug: string }

interface BlogPageProps {
  params: Promise<BlogParams>
}

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

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app').replace(/\/$/, '')

export const dynamicParams = false

export function generateStaticParams() {
  return blogPosts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts.find(item => item.slug === slug)

  if (!post) {
    return {
      title: 'Article Not Found • CryptoFlash Blog'
    }
  }

  const url = `${baseUrl}/blog/${post.slug}`

  return {
    title: `${post.title} | CryptoFlash Blog`,
    description: post.description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: 'article',
      publishedTime: post.date,
      authors: ['CryptoFlash']
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description
    }
  }
}

export default async function BlogArticlePage({ params }: BlogPageProps) {
  const { slug } = await params
  const post = blogPosts.find(item => item.slug === slug)

  if (!post) {
    notFound()
  }

  const articleUrl = `${baseUrl}/blog/${post.slug}`
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: 'CryptoFlash'
    },
    publisher: {
      '@type': 'Organization',
      name: 'CryptoFlash',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/og-image.png`
      }
    },
    mainEntityOfPage: articleUrl,
    image: `${baseUrl}/og-image.png`,
    url: articleUrl
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: articleUrl }
    ]
  }

  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <MarketingNavbar />

      <Script
        id={`article-schema-${post.slug}`}
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([articleSchema, breadcrumbSchema]) }}
      />

      <main className="w-screen flex-1">
        <div className="mb-10 space-y-4">
          <Link prefetch={false}
            href="/blog"
            className="inline-flex items-center text-sm text-[#94A3B8] hover:text-[#00FFA3] transition-colors"
          >
            ← Back to blog
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text font-heading">{post.title}</h1>
          <p className="text-[#94A3B8] leading-relaxed">{post.hero ?? post.description}</p>
          <div className="flex items-center gap-4 text-xs text-[#6b7280] uppercase tracking-widest">
            <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
        </div>

        <article className="prose prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl prose-headings:font-heading max-w-none">
          {post.sections.map(section => (
            <section key={section.heading} className="mb-10">
              <h2 className="font-heading">{section.heading}</h2>
              {section.body.map((paragraph, index) => (
                <p key={`${section.heading}-${index}`}>{paragraph}</p>
              ))}
            </section>
          ))}

          <section className="mb-10">
            <h2 className="font-heading">Key Takeaways</h2>
            <ul>
              {post.keyTakeaways.map(takeaway => (
                <li key={takeaway}>{takeaway}</li>
              ))}
            </ul>
          </section>
        </article>

        <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 font-heading">
            Ready to Start Tracking KOTH?
          </h3>
          <p className="text-sm text-[#b8c5d6] mb-4">
            Set up CryptoFlash alerts, overlay whale inflows and execute your KOTH strategy with data instead of hype.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link prefetch={false}
              href="/alerts"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[#00FFA3] text-[#050712] font-semibold hover:opacity-90 transition-opacity"
            >
              Configure Alerts
            </Link>
            <Link prefetch={false}
              href="/whale-alerts"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors"
            >
              Monitor Whale Flow
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

