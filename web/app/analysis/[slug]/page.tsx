interface Props {
  params: {
    slug: string;
  };
}

export default function AnalysisPage({ params }: Props) {
  const { slug } = params;

  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold">Analysis coming soon</h1>
      <p className="text-muted-foreground mt-4">
        Post: {slug}
      </p>
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}
