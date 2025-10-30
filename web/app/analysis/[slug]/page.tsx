export default function AnalysisPage({
  params,
}: {
  params: { slug: string; [key: string]: string };
}) {
  const { slug } = params;
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold">Analysis coming soon</h1>
      <p className="text-muted-foreground mt-4">Post: {slug}</p>
    </div>
  );
}

// empty for now so Next is happy during build
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}
