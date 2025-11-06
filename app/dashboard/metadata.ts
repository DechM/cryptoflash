import { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'

export const dashboardMetadata: Metadata = {
  title: 'Live KOTH Dashboard | Real-time Pump.fun Token Tracker | CryptoFlash',
  description: 'Live dashboard tracking Pump.fun KOTH tokens in real-time. See bonding curve progress, AI Snipe Scores, whale activity, and volume. Track tokens at 90%+ progress before they hit KOTH.',
  keywords: 'pump.fun dashboard, KOTH dashboard, live token tracker, bonding curve progress, real-time crypto tracker, Solana memecoin dashboard, pump.fun live data',
  openGraph: {
    title: 'Live KOTH Dashboard - Real-time Pump.fun Tracker',
    description: 'Track Pump.fun KOTH tokens in real-time. See bonding curve progress, AI scores, and early signals.',
    url: `${siteUrl}/dashboard`,
    type: 'website',
  },
  alternates: {
    canonical: `${siteUrl}/dashboard`,
  },
}

