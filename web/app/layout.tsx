import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'CryptoFlash — Real-Time Crypto Signals & Movers',
  description: 'Live crypto signals, top movers, and insights — stay ahead with actionable market intelligence.',
  metadataBase: new URL('https://cryptoflash.app'),
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'CryptoFlash',
    title: 'CryptoFlash — Real-Time Crypto Signals & Movers',
    description: 'Live crypto signals, top movers, and insights — stay ahead with actionable market intelligence.',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'CryptoFlash',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@CryptoFlashGuru',
    title: 'CryptoFlash — Real-Time Crypto Signals & Movers',
    description: 'Live crypto signals, top movers, and insights — stay ahead with actionable market intelligence.',
    images: ['/og.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Header />
          <main className="container mx-auto px-4 py-6 sm:py-8 md:py-10">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

