import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About — CryptoFlash',
    description: 'The story behind CryptoFlash and our mission to deliver fast, actionable crypto intelligence.',
    alternates: {
      canonical: 'https://cryptoflash.app/about',
    },
    openGraph: {
      title: 'About — CryptoFlash',
      description: 'The story behind CryptoFlash.',
      url: 'https://cryptoflash.app/about',
    },
  };
}

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold mb-2">About CryptoFlash</h1>
        <p className="text-muted-foreground">
          CryptoFlash provides AI-powered crypto insights, market signals, and long-form research.
        </p>
      </div>
      <div className="prose prose-invert">
        <p>
          Built for founders, traders, and analysts who want high-signal information fast. We aggregate
          data from multiple sources including DEX signals, prediction markets, and news feeds to give you
          a comprehensive view of the crypto market in one place.
        </p>
      </div>
    </div>
  );
}

