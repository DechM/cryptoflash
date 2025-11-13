'use client'

import React, { startTransition, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

type HeroImage = {
  src: string
  alt: string
}

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
  heroImage?: HeroImage
  canonicalUrl?: string
  nextPost?: NavPost | null
  previousPost?: NavPost | null
  relatedPosts?: RelatedPost[]
  children: React.ReactNode
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

export function BlogPostLayout({
  title,
  description,
  date,
  author = "CryptoFlash Research",
  authorRole = "On-chain Intelligence",
  authorAvatar,
  readTime = "8 min read",
  tags = [],
  heroImage,
  canonicalUrl,
  previousPost,
  nextPost,
  relatedPosts = [],
  children,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [headings, setHeadings] = useState<Array<{ id: string; text: string }>>([])
  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const hs = Array.from(el.querySelectorAll("h2"))
    const list: Array<{ id: string; text: string }> = []

    hs.forEach(h => {
      const text = h.textContent?.trim() || ""
      if (!text) return
      const id = h.id || slugify(text)
      h.id = id
      list.push({ id, text })
    })
    startTransition(() => {
      setHeadings(list)
    })
  }, [children])

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
      image: heroImage?.src,
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
  }, [title, description, date, author, heroImage?.src, canonicalUrl, tags])

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
    <article className="min-h-screen bg-neutral-950 text-neutral-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-[860px] mx-auto px-4 md:px-6 py-10 md:py-14">
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

      {heroImage && (
        <div className="max-w-[1100px] mx-auto px-4 md:px-6 mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage.src}
            alt={heroImage.alt}
            loading="lazy"
            className="w-full rounded-2xl border border-white/10 object-cover shadow-2xl aspect-[16/9]"
          />
        </div>
      )}

      <div className="max-w-[1100px] mx-auto px-4 md:px-6 mt-10 md:mt-12 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-8 xl:gap-12">
        <main className="max-w-[860px] mx-auto xl:mx-0 w-full">
          <div className="xl:hidden mb-8">
            <button
              type="button"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-200 flex items-center justify-between"
              onClick={() => setMobileTocOpen(prev => !prev)}
              aria-expanded={mobileTocOpen}
              aria-controls="mobile-toc"
            >
              On this page
              <span className="text-xs text-gray-400">{mobileTocOpen ? "Hide" : "Show"}</span>
            </button>
            {mobileTocOpen && (
              <nav id="mobile-toc" className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                {headings.length === 0 ? (
                  <div className="text-sm text-gray-500">—</div>
                ) : (
                  headings.map(h => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className="block text-sm text-gray-300 hover:text-white transition"
                      onClick={() => setMobileTocOpen(false)}
                    >
                      {h.text}
                    </a>
                  ))
                )}
              </nav>
            )}
          </div>

          <div
            ref={contentRef}
            className="prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-h2:mt-12 prose-h3:mt-8 prose-p:leading-8 prose-li:leading-8 prose-pre:bg-neutral-900 prose-blockquote:border-l-4 prose-blockquote:border-white/20 prose-blockquote:text-white/80 prose-blockquote:pl-4 prose-blockquote:italic"
          >
            {React.Children.map(children, child => {
              if (!child) return null
              if (typeof child === "string") return <p>{child}</p>
              return child
            })}
          </div>

          <section className="mt-14">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-7 md:px-8 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Track KOTH and whale inflows in real time
                </h3>
                <p className="mt-2 text-white/70">
                  Catch momentum before it trends. Dashboards, automated alerts, Discord sync.
                </p>
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
            </div>
          </section>

          <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-7 flex gap-4 md:gap-5">
          {authorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={authorAvatar}
              alt={author}
              className="h-16 w-16 rounded-full border border-white/10 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-16 w-16 rounded-full border border-white/10 bg-white/10 flex items-center justify-center text-xl font-semibold text-white/80">
              {author
                .split(" ")
                .map(part => part.charAt(0))
                .join("")
                .slice(0, 2)}
            </div>
          )}
            <div>
              <p className="text-sm uppercase tracking-wide text-white/50">Author</p>
              <h4 className="text-lg font-semibold text-white mt-1">{author}</h4>
              <p className="text-sm text-white/60">{authorRole}</p>
              <p className="mt-3 text-sm text-white/70">
                We distill on-chain flow, bonding-curve pace и Discord alerts до actionable сигнали, за да реагираш
                преди масата.
              </p>
            </div>
          </section>

          <nav className="mt-12 grid gap-4 md:grid-cols-2">
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
            <section className="mt-12">
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

        <aside className="hidden xl:block sticky top-24 h-max">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">On this page</p>
            <nav className="space-y-2">
              {headings.length === 0 ? (
                <div className="text-sm text-gray-500">—</div>
              ) : (
                headings.map(h => (
                  <a key={h.id} href={`#${h.id}`} className="block text-sm text-gray-300 hover:text-white transition">
                    {h.text}
                  </a>
                ))
              )}
            </nav>
          </div>
        </aside>
      </div>

      <footer className="w-full border-t border-white/10 mt-16">
        <div className="max-w-[860px] mx-auto px-4 md:px-6 py-12">
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

