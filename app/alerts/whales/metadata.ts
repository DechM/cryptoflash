import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'

const pageUrl = `${siteUrl.replace(/\/$/, '')}/alerts/whales`

export const metadata: Metadata = {
  title: 'Whale Alerts Settings | CryptoFlash',
  description: 'Manage your CryptoFlash whale alert subscription, Discord role and Solana Pay billing.',
  alternates: {
    canonical: pageUrl,
  },
  robots: {
    index: false,
    follow: false,
  },
}


