import { requireProgramme } from "@/lib/data/context";

export default async function ProgrammeLayout({ children, params }: { children: React.ReactNode; params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  await requireProgramme(pid);
  return children;
}
