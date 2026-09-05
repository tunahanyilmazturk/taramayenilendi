import EmployeeDetailPage from "@/components/personnel/employee-detail-page";

export default async function EmployeeDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeDetailPage employeeId={Number(id)} />;
}
