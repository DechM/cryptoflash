import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Subscribe — CryptoFlash',
  description: 'Get CryptoFlash AI briefs and signals in your inbox.',
};

export default function SubscribePage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Subscribe</h1>
      <p className="text-muted-foreground">Join the early access list for signals and research.</p>
      <form className="flex gap-2">
        <input
          type="email"
          placeholder="you@example.com"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit">Join</Button>
      </form>
    </div>
  );
}

