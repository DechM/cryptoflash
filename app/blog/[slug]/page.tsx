import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MarketingNavbar } from '@/components/MarketingNavbar'
import postsModule, { BlogPost } from '../posts'
import { BlogPostLayout } from '@/components/BlogPostLayout'

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

  const canonical = post.canonicalUrl ?? `${baseUrl}/blog/${post.slug}`
  const description = post.hero ?? post.description

  return {
    title: `${post.title} | CryptoFlash Blog`,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      title: post.title,
      description,
      url: canonical,
      type: 'article',
      publishedTime: post.date,
      authors: ['CryptoFlash'],
      tags: post.tags,
      images: post.heroImage?.src ? [{ url: post.heroImage.src, alt: post.heroImage.alt }] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: post.heroImage?.src ? [post.heroImage.src] : undefined
    }
  }
}

export default async function BlogArticlePage({ params }: BlogPageProps) {
  const { slug } = await params
  const post = blogPosts.find(item => item.slug === slug)

  if (!post) {
    notFound()
  }

  const fallbackRelated = blogPosts.filter(item => item.slug !== post.slug).slice(0, 3)
  const canonicalUrl = post.canonicalUrl ?? `${baseUrl}/blog/${post.slug}`
  const index = blogPosts.findIndex(item => item.slug === post.slug)
  const previousPost = index > 0 ? blogPosts[index - 1] : null
  const nextPost = index < blogPosts.length - 1 ? blogPosts[index + 1] : null
  const relatedByTag = blogPosts
    .filter(
      item =>
        item.slug !== post.slug &&
        item.tags?.some(tag => post.tags?.includes(tag)),
    )
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <MarketingNavbar />

      <main className="w-screen flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 md:px-8 py-6">
          <Link
            prefetch={false}
            href="/blog"
            className="inline-flex items-center text-sm text-[#94A3B8] hover:text-[#00FFA3] transition-colors"
          >
            ← Back to blog
          </Link>
        </div>

        <BlogPostLayout
          title={post.title}
          description={post.hero ?? post.description}
          date={post.date}
          readTime={post.readTime}
          tags={post.tags}
          heroImage={post.heroImage}
          canonicalUrl={canonicalUrl}
          author={post.author}
          authorRole={post.authorRole}
          authorAvatar={post.authorAvatar}
          previousPost={previousPost ? { slug: previousPost.slug, title: previousPost.title } : null}
          nextPost={nextPost ? { slug: nextPost.slug, title: nextPost.title } : null}
          relatedPosts={
            relatedByTag.length > 0
              ? relatedByTag.map(item => ({
                  slug: item.slug,
                  title: item.title,
                  readTime: item.readTime,
                }))
              : fallbackRelated.map(item => ({
                  slug: item.slug,
                  title: item.title,
                  readTime: item.readTime,
                }))
          }
        >
          {post.content}

          {post.keyTakeaways.length > 0 && (
            <section className="mt-12">
              <h2>Key Takeaways</h2>
              <ul>
                {post.keyTakeaways.map(takeaway => (
                  <li key={takeaway}>{takeaway}</li>
                ))}
              </ul>
            </section>
          )}
        </BlogPostLayout>
      </main>
    </div>
  )
}
