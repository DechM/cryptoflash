import { MetadataRoute } from 'next';
import { getTrackedWallets } from '@/lib/whales/tracker';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://cryptoflash.app';

  // Get tracked wallets for dynamic wallet pages
  let walletAddresses: string[] = [];
  try {
    const wallets = await getTrackedWallets();
    walletAddresses = wallets.map((w) => w.address);
  } catch (error) {
    console.error('Failed to fetch wallets for sitemap:', error);
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
      url: `${baseUrl}/wallets`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/signals`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/leaderboard`,
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
  ];

  // Dynamic wallet pages
  const walletPages: MetadataRoute.Sitemap = walletAddresses.map((address) => ({
    url: `${baseUrl}/wallet/${address}`,
    lastModified: new Date(),
    changeFrequency: 'always',
    priority: 0.85,
  }));

  return [...staticPages, ...walletPages];
}
