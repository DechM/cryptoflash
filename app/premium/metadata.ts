import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'

const pageUrl = `${siteUrl.replace(/\/$/, '')}/premium`

export const metadata: Metadata = {
  title: 'Pricing | KOTH & Whale Alert Plans | CryptoFlash',
  description:
    'Compare CryptoFlash plans for KOTH alerts, cross-chain whale tracking and premium analytics. Choose between Free, Pro and Ultimate tiers with Solana Pay checkout.',
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: 'CryptoFlash Pricing – Alerts for KOTH & Whale Activity',
    description:
      'Unlock earlier KOTH signals, live whale alerts and premium analytics. Explore Free, Pro and Ultimate plans tailored for Pump.fun and Solana snipers.',
    url: pageUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CryptoFlash Pricing',
    description:
      'Discover plans for real-time KOTH notifications, whale alerts and premium Solana analytics. Upgrade to Pro or Ultimate to stay ahead.',
  },
}


