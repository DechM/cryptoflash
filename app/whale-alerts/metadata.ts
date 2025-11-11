import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'

const pageUrl = `${siteUrl.replace(/\/$/, '')}/whale-alerts`

export const metadata: Metadata = {
  title: 'Whale Alerts | Real-time Cross-Chain Whale Tracker | CryptoFlash',
  description:
    'Monitor large on-chain transfers across Ethereum, BNB Chain, Polygon and more. CryptoFlash Whale Alerts flags every $20K+ move with rich context, Discord embeds and automated tweets.',
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: 'Whale Alerts – Live Cross-Chain Whale Tracker',
    description:
      'Track crypto whale activity in real time. See the biggest $20K+ moves, value breakdowns and wallet flow analytics powered by CryptoFlash.',
    url: pageUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Whale Alerts | CryptoFlash',
    description:
      'Follow high-value crypto whale transfers ($20K+) across chains with live dashboards, Discord embeds and automated alerts.',
  },
}


