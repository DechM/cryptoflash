import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Prediction Market Signals — CryptoFlash',
  description: 'Aggregated on-chain and prediction market indicators.',
};

export default function PredictionsPage() {
  return (
    <div className="container-grid">
      <h1 className="text-2xl font-semibold">Prediction Market Signals</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Market {i}</CardTitle>
            </CardHeader>
            <CardContent>Coming soon…</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

