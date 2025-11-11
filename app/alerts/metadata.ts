import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'

const pageUrl = `${siteUrl.replace(/\/$/, '')}/alerts`

export const metadata: Metadata = {
  title: 'Manage KOTH Alerts | CryptoFlash',
  description: 'Manage your CryptoFlash KOTH alert rules, Discord integration and thresholds.',
  alternates: {
    canonical: pageUrl,
  },
  robots: {
    index: false,
    follow: false,
  },
}


