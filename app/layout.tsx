import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "CryptoFlash"
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cryptoflash.app"

export const metadata: Metadata = {
  title: "CryptoFlash | The FIRST Real-time KOTH Tracker for Pump.fun - Snipe Winners Early!",
  description: "The ONLY automated real-time KOTH tracker for Pump.fun. Get early alerts at 69%+ progress, track bonding curve, AI Snipe Score, and snipe winners before they moon. First-mover advantage in KOTH tracking.",
  keywords: "pump.fun KOTH tracker, King of the Hill tracker, pump.fun sniper tool, real-time bonding curve tracker, Solana memecoin alerts, pump.fun early detection, KOTH alerts, bonding curve progress tracker, pump.fun token tracker, Solana memecoin sniper, early KOTH signals, pump.fun winner tracker",
  authors: [{ name: "CryptoFlash" }],
  creator: "CryptoFlash",
  publisher: "CryptoFlash",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "CryptoFlash - The FIRST Real-time KOTH Tracker for Pump.fun",
    description: "The ONLY automated real-time KOTH tracker. Get early alerts at 69%+ progress, track bonding curve, and snipe Pump.fun winners before they moon!",
    type: "website",
    siteName: siteName,
    url: siteUrl,
    locale: "en_US",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "CryptoFlash - Real-time KOTH Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CryptoFlash - The FIRST Real-time KOTH Tracker",
    description: "Get early alerts at 69%+ progress. Track KOTH before it happens!",
    creator: "@cryptoflash",
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: siteUrl,
  },
  metadataBase: new URL(siteUrl),
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased w-full`}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-L3NYZ6V64K"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-L3NYZ6V64K');
          `}
        </Script>
        {/* Structured Data (JSON-LD) for SEO */}
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "CryptoFlash",
              "description": "The FIRST automated real-time KOTH tracker for Pump.fun. Get early alerts at 69%+ progress, track bonding curve, and snipe winners before they moon!",
              "url": siteUrl,
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "ratingCount": "1"
              },
              "featureList": [
                "Real-time KOTH tracking",
                "Early alerts at 69%+ progress",
                "AI Snipe Score (0-100)",
                "Bonding curve progress tracking",
                "Automated Twitter/X alerts",
                "Discord notifications",
                "Live dashboard"
              ],
              "screenshot": `${siteUrl}/og-image.png`
            })
          }}
        />
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "CryptoFlash",
              "url": siteUrl,
              "logo": `${siteUrl}/favicon.ico`,
              "description": "The FIRST automated real-time KOTH tracker for Pump.fun",
              "sameAs": [
                "https://x.com/CryptoFlashGuru"
              ]
            })
          }}
        />
        <div className="flex flex-col min-h-screen">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
