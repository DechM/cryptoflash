import { MetadataRoute } from 'next';
import { getMovers } from '@/lib/movers';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://cryptoflash.app';

  // Get top assets from movers for dynamic asset pages
  let assetIds: string[] = [];
  try {
    const movers = await getMovers();
    // Take top 200 coins for sitemap
    assetIds = movers.slice(0, 200).map((m) => m.id);
  } catch (error) {
    console.error('Failed to fetch movers for sitemap:', error);
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/signals`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/predictions`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/subscribe`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Dynamic asset pages
  const assetPages: MetadataRoute.Sitemap = assetIds.map((id) => ({
    url: `${baseUrl}/asset/${id}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  return [...staticPages, ...assetPages];
}
