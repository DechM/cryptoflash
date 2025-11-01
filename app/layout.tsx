import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PumpKing Sniper | Free KOTH Tracker - Snipe Pump.fun Winners Early!",
  description: "Real-time KOTH tracker for Pump.fun memecoins. Get early alerts, track bonding curve progress, and snipe winners before they moon!",
  keywords: "pump.fun, KOTH, memecoin, Solana, bonding curve, crypto sniper, pump tracker",
  openGraph: {
    title: "PumpKing Sniper - Free KOTH Tracker",
    description: "Snipe Pump.fun winners early with real-time alerts",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PumpKing Sniper",
    description: "Real-time KOTH tracker for Pump.fun",
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
        {children}
      </body>
    </html>
  );
}
