import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'AI Crypto Briefs — CryptoFlash',
  description: 'Concise AI-generated crypto news summaries.',
};

export default function NewsPage() {
  return (
    <div className="container-grid">
      <h1 className="text-2xl font-semibold">AI Crypto Briefs</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Brief {i}</CardTitle>
            </CardHeader>
            <CardContent>Placeholder summary…</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

