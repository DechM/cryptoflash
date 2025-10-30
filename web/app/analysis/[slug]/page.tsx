import type { Metadata } from 'next';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `${params.slug} — Analysis — CryptoFlash`,
    description: `Long-form research for ${params.slug}.`,
  };
}

export default function AnalysisPage({ params }: Props) {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="mb-2 capitalize">{params.slug.replace(/-/g, ' ')}</h1>
      <p className="text-muted-foreground">Long-form research placeholder content.</p>
    </article>
  );
}

