// app/analysis/[slug]/page.tsx

type PageProps = {
  // Next.js 15 may supply params as a Promise in app router
  params: Promise<{ slug?: string }>;
};

export default async function AnalysisPage({ params }: PageProps) {
  const { slug = "" } = await params; // <-- await the promise

  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-bold">Analysis coming soon</h1>
      <p className="mt-4 text-muted-foreground">Post: {slug}</p>
    </div>
  );
}

// keep it empty for now so build is happy
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}
