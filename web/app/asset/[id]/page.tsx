import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AssetHeader } from '@/components/asset/AssetHeader';
import { AssetChart } from '@/components/asset/AssetChart';
import { getAssetData, getAssetOHLC } from '@/lib/asset';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const asset = await getAssetData(id);

  if (!asset) {
    return {
      title: 'Asset Not Found — CryptoFlash',
    };
  }

  return {
    title: `${asset.name} (${asset.symbol}) — CryptoFlash`,
    description: `Live price, charts, and market data for ${asset.name}. Current price: ${asset.currentPrice.toFixed(2)} USD.`,
    alternates: {
      canonical: `https://cryptoflash.app/asset/${id}`,
    },
    openGraph: {
      title: `${asset.name} (${asset.symbol}) — CryptoFlash`,
      description: `Live price and market data for ${asset.name}.`,
      url: `https://cryptoflash.app/asset/${id}`,
      images: asset.image ? [{ url: asset.image }] : undefined,
    },
  };
}

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [asset, ohlcData] = await Promise.all([
    getAssetData(id),
    getAssetOHLC(id, 7).catch(() => getAssetOHLC(id, 1)), // Fallback to 1 day if 7 fails
  ]);

  if (!asset) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AssetHeader asset={asset} />

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Price Chart (7 days)</h2>
          {ohlcData.length === 0 ? (
            <Alert variant="default">
              <AlertDescription>Chart data temporarily unavailable.</AlertDescription>
            </Alert>
          ) : (
            <AssetChart data={ohlcData} livePrice={asset.id === 'bitcoin' || asset.id === 'ethereum' ? asset.currentPrice : undefined} />
          )}
        </CardContent>
      </Card>

      {asset.description && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">About {asset.name}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {asset.description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
