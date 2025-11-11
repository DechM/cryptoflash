import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'

const pageUrl = `${siteUrl.replace(/\/$/, '')}/premium/success`

export const metadata: Metadata = {
  title: 'Payment Successful | CryptoFlash Premium',
  description: 'Your CryptoFlash subscription is active. Follow the instructions on screen to link Discord and unlock premium alerts.',
  alternates: {
    canonical: pageUrl,
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Payment Confirmed – CryptoFlash',
    description: 'Thank you for upgrading. Link Discord to activate premium KOTH and whale alerts.',
    url: pageUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'CryptoFlash – Payment Confirmed',
    description: 'Your subscription is live. Complete setup to start receiving alerts instantly.',
  },
}


