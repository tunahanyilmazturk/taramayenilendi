import PersonnelDetailPage from "@/components/personnel/personnel-detail-page";

export default async function PersonnelDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonnelDetailPage personnelId={id} />;
}
