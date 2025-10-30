import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — CryptoFlash',
  description: 'The story behind CryptoFlash.',
};

export default function AboutPage() {
  return (
    <div className="prose prose-invert max-w-2xl">
      <h1>About CryptoFlash</h1>
      <p>
        CryptoFlash provides AI-powered crypto insights, market signals, and long-form research.
        Built for founders, traders, and analysts who want high-signal information fast.
      </p>
    </div>
  );
}

