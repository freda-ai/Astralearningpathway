import { PageHeader } from "@/components/ui/card";
import { requireProgramme } from "@/lib/data/context";

export default async function DashboardPage({ params }: { params: Promise<{ pid: string }> }) {
  const { programme } = await requireProgramme((await params).pid);
  return <PageHeader title={programme.name} description="Dashboard" />;
}
