import type { Metadata } from 'next';
import { SubscribeForm } from '@/components/subscribe/SubscribeForm';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Subscribe — CryptoFlash',
    description: 'Get CryptoFlash AI briefs and signals delivered to your inbox.',
    alternates: {
      canonical: 'https://cryptoflash.app/subscribe',
    },
    openGraph: {
      title: 'Subscribe — CryptoFlash',
      description: 'Get CryptoFlash AI briefs and signals delivered to your inbox.',
      url: 'https://cryptoflash.app/subscribe',
    },
  };
}

export default function SubscribePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Subscribe</h1>
        <p className="text-muted-foreground">
          Join the early access list to receive signals, predictions, and AI briefs directly in your inbox.
        </p>
      </div>
      <SubscribeForm />
    </div>
  );
}

