import { MetadataRoute } from 'next'
import { blogPosts } from './blog/posts'

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'
const siteUrl = siteOrigin.replace(/\/$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date('2024-11-12')

  const staticEntries: Array<MetadataRoute.Sitemap[number]> = [
    {
      url: siteUrl,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/dashboard`,
      lastModified: today,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/alerts`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/alerts/whales`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/premium`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/premium/success`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.2,
    },
    {
      url: `${siteUrl}/leaderboard`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/whale-alerts`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/koth-tracker`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: today,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: today,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${siteUrl}/disclaimer`,
      lastModified: today,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${siteUrl}/monitoring`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.3,
    },
  ]

  const articleEntries: Array<MetadataRoute.Sitemap[number]> = blogPosts.map(post => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticEntries, ...articleEntries]
}

