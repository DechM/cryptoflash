import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'

export const metadata: Metadata = {
  title: 'Live KOTH Dashboard | Real-time Solana Curve Tracker | CryptoFlash',
  description: 'Live dashboard tracking Solana KOTH trajectories in real-time. Monitor bonding-curve progress, AI Snipe Scores, whale flow and volume before liquidity unlocks.',
  openGraph: {
    title: 'Live KOTH Dashboard - Real-time Solana Curve Tracker',
    description: 'Track Solana KOTH candidates in real-time. See bonding-curve progress, AI scores and early signals captured by CryptoFlash.',
    url: `${siteUrl}/dashboard`,
    type: 'website',
  },
}

