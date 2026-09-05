import ScreeningDetailPage from "@/components/screenings/screening-detail-page";

export default async function ScreeningDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScreeningDetailPage screeningId={id} />;
}
