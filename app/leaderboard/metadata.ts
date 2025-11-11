import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'

const pageUrl = `${siteUrl.replace(/\/$/, '')}/leaderboard`

export const metadata: Metadata = {
  title: 'Pump.fun Sniper Leaderboard | Top KOTH Wallets | CryptoFlash',
  description:
    'See the top Pump.fun wallets ranked by successful KOTH snipes, profits and win rate. Updated in real time from CryptoFlash telemetry.',
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: 'CryptoFlash Leaderboard – Top Pump.fun KOTH Wallets',
    description:
      'Track the best-performing Pump.fun snipers with real-time stats for snipes, profit and success rate. Powered by CryptoFlash.',
    url: pageUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pump.fun Sniper Leaderboard',
    description:
      'Live ranking of Pump.fun KOTH wallets with profit and success metrics. Discover elite snipers with CryptoFlash.',
  },
}


