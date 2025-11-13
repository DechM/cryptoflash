'use client'

import React, { startTransition, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

type HeroImage = {
  src: string
  alt: string
}

type Props = {
  title: string
  description?: string
  date: string
  author?: string
  readTime?: string
  tags?: string[]
  heroImage?: HeroImage
  canonicalUrl?: string
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
  readTime = "8 min read",
  tags = [],
  heroImage,
  canonicalUrl,
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
  }, [title, description, date, author, heroImage?.src, canonicalUrl])

  return (
    <article className="w-full bg-[#050B18] text-gray-200">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="w-full border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="w-full px-6 md:px-12 xl:px-24 py-10 md:py-14 space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-[#00ffa3]">
            <time dateTime={date} className="text-[#9feccd]">
              {new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
            <span className="text-gray-400">•</span>
            <span className="text-gray-300">{readTime}</span>
            {tags.length > 0 && (
              <>
                <span className="text-gray-400">•</span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#00ffa3]/30 bg-[#0b1a2f] px-2.5 py-0.5 text-[#00ffa3]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <h1 className="text-white font-semibold leading-tight text-3xl md:text-5xl xl:text-6xl">{title}</h1>

          {description && (
            <p className="max-w-3xl text-base md:text-lg text-gray-300 leading-relaxed tracking-wide">{description}</p>
          )}

          <div className="text-sm text-gray-400">
            By <span className="text-gray-200">{author}</span>
          </div>

          {heroImage && (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage.src} alt={heroImage.alt} className="w-full h-auto" />
            </div>
          )}
        </div>
      </header>

      <div className="w-full px-6 md:px-12 xl:px-24 py-10 md:py-14 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-12">
        <div ref={contentRef} className="prose prose-invert max-w-none prose-headings:scroll-mt-28 prose-p:leading-relaxed prose-li:leading-relaxed">
          {React.Children.map(children, child => {
            if (!child) return null
            if (typeof child === "string") {
              return <p>{child}</p>
            }
            return child
          })}
        </div>

        <aside className="lg:block hidden">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">On this page</div>
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

        <div className="lg:hidden block">
          <button
            type="button"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 flex items-center justify-between"
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
      </div>

      <footer className="w-full border-t border-white/10">
        <div className="w-full px-6 md:px-12 xl:px-24 py-12">
          <div className="rounded-3xl border border-[#00ffa3]/30 bg-[#00ffa3]/10 p-8 md:p-10 text-center space-y-4">
            <h3 className="text-white text-2xl md:text-3xl font-semibold">Track the next unlocks live on CryptoFlash</h3>
            <p className="max-w-prose mx-auto text-gray-300">
              Real-time KOTH progress, AI Snipe Score and whale flow—no noise, just signal.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold bg-[#00ffa3] text-[#04121f] shadow-lg hover:-translate-y-0.5 transition"
              >
                Open Dashboard
              </Link>
              <Link
                href="/alerts"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
              >
                Explore Alerts
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-400">
            <Link href="/premium" className="hover:text-white">
              Premium
            </Link>
            <Link href="/blog/koth-progression-playbook" className="hover:text-white">
              KOTH Playbook
            </Link>
            <Link href="/alerts" className="hover:text-white">
              Alerts
            </Link>
          </div>
        </div>
      </footer>
    </article>
  )
}

