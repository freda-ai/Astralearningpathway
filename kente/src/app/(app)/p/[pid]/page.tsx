import { redirect } from "next/navigation";

export default async function ProgrammeIndex({ params }: { params: Promise<{ pid: string }> }) {
  redirect(`/p/${(await params).pid}/dashboard`);
}
