import ResultsDetailPage from "@/components/results/results-detail-page";

export default async function ResultsDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResultsDetailPage screeningId={id} />;
}
