'use client'

import React, { useMemo } from "react"
import Link from "next/link"

type NavPost = {
  slug: string
  title: string
}

type RelatedPost = {
  slug: string
  title: string
  readTime: string
}

type Props = {
  title: string
  description?: string
  date: string
  author?: string
  authorRole?: string
  authorAvatar?: string
  readTime?: string
  tags?: string[]
  canonicalUrl?: string
  heroImage?: { src: string; alt: string }
  nextPost?: NavPost | null
  previousPost?: NavPost | null
  relatedPosts?: RelatedPost[]
  children: React.ReactNode
}

export function BlogPostLayout({
  title,
  description,
  date,
  author = "CryptoFlash Research",
  authorRole,
  authorAvatar,
  readTime = "8 min read",
  tags = [],
  canonicalUrl,
  previousPost,
  nextPost,
  relatedPosts = [],
  children,
}: Props) {
  const jsonLd = useMemo(() => {
    const published = new Date(date).toISOString()
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title,
      description,
      datePublished: published,
      dateModified: published,
      author: [{ "@type": "Person", name: author }],
      articleSection: tags,
      mainEntityOfPage: canonicalUrl,
      publisher: {
        "@type": "Organization",
        name: "CryptoFlash",
        logo: {
          "@type": "ImageObject",
          url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://cryptoflash.app"}/og-image.png`,
        },
      },
    }
  }, [title, description, date, author, canonicalUrl, tags])

  const formattedDate = useMemo(
    () =>
      new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [date],
  )

  return (
    <article className="min-h-screen w-screen bg-[#050B18] text-neutral-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="w-full px-6 md:px-12 lg:px-16 py-10 md:py-14">
          <Link
            prefetch={false}
            href="/blog"
            className="text-sm inline-flex items-center gap-2 text-white/60 hover:text-white/90 transition"
          >
            ← Back to blog
          </Link>
          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight text-white">{title}</h1>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/60">
            <time dateTime={date}>{formattedDate}</time>
            <span>•</span>
            <span>{readTime}</span>
            {tags.length > 0 && (
              <>
                <span>•</span>
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          {description && (
            <p className="mt-4 text-lg text-white/70 leading-relaxed tracking-wide">{description}</p>
          )}
        </div>
      </header>

      <div className="w-full px-6 md:px-12 lg:px-16 mt-10 md:mt-12">
        <main className="w-full space-y-12">
          <div className="prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-h2:mt-12 prose-h3:mt-8 prose-p:leading-8 prose-li:leading-8 prose-pre:bg-neutral-900 prose-blockquote:border-l-4 prose-blockquote:border-white/20 prose-blockquote:text-white/80 prose-blockquote:pl-4 prose-blockquote:italic">
            {children}
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-7 md:px-8 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white">Track KOTH and whale inflows in real time</h3>
              <p className="mt-2 text-white/70">Catch momentum before it trends. Dashboards, automated alerts, Discord sync.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                prefetch={false}
                href="/dashboard"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition"
              >
                Open Dashboard
              </Link>
              <Link
                prefetch={false}
                href="/alerts"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-white/15 text-white hover:bg-white/10 transition"
              >
                Configure Alerts
              </Link>
            </div>
          </section>

          <nav className="grid gap-4 md:grid-cols-2">
            {previousPost ? (
              <Link
                prefetch={false}
                href={`/blog/${previousPost.slug}`}
                className="p-5 rounded-xl border border-white/10 hover:bg-white/5 transition flex flex-col gap-2"
              >
                <span className="text-xs uppercase tracking-widest text-white/50">Previous</span>
                <span className="text-sm md:text-base text-white/90">{previousPost.title}</span>
              </Link>
            ) : (
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] text-white/30">Start of archive</div>
            )}

            {nextPost ? (
              <Link
                prefetch={false}
                href={`/blog/${nextPost.slug}`}
                className="p-5 rounded-xl border border-white/10 hover:bg-white/5 transition flex flex-col gap-2 text-right"
              >
                <span className="text-xs uppercase tracking-widest text-white/50">Next</span>
                <span className="text-sm md:text-base text-white/90">{nextPost.title}</span>
              </Link>
            ) : (
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] text-white/30 text-right">
                New posts coming soon
              </div>
            )}
          </nav>

          {relatedPosts.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-4">Related reads</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {relatedPosts.map(item => (
                  <Link
                    key={item.slug}
                    prefetch={false}
                    href={`/blog/${item.slug}`}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-[#00ffa3]/40 transition flex flex-col gap-3"
                  >
                    <span className="text-sm font-medium text-white/90 leading-snug">{item.title}</span>
                    <span className="text-xs uppercase tracking-widest text-white/45">{item.readTime}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="w-full border-t border-white/10 mt-16">
        <div className="w-full px-6 md:px-12 lg:px-16 py-12">
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <Link prefetch={false} href="/premium" className="hover:text-white">
              Premium
            </Link>
            <Link prefetch={false} href="/blog/koth-progression-playbook" className="hover:text-white">
              KOTH Playbook
            </Link>
            <Link prefetch={false} href="/alerts" className="hover:text-white">
              Alerts
            </Link>
          </div>
        </div>
      </footer>
    </article>
  )
}
