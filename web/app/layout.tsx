import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'CryptoFlash Hub — Whale Signal Command Center',
  description: 'Real-time whale intelligence & signal tracking. Monitor smart money moves, track wallet positions, and get AI-powered trading signals.',
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
    siteName: 'CryptoFlash Hub',
    title: 'CryptoFlash Hub — Whale Signal Command Center',
    description: 'Real-time whale intelligence & signal tracking. Monitor smart money moves, track wallet positions, and get AI-powered trading signals.',
    images: [
      {
        url: '/branding/crypto-flash-x-profile-picture.png',
        width: 1200,
        height: 630,
        alt: 'CryptoFlash Hub',
      },
    ],
    url: 'https://cryptoflash.app',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@CryptoFlashGuru',
    title: 'CryptoFlash Hub — Whale Signal Command Center',
    description: 'Real-time whale intelligence & signal tracking.',
    images: ['/branding/crypto-flash-x-profile-picture.png'],
  },
  alternates: {
    canonical: 'https://cryptoflash.app',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 md:py-10">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

