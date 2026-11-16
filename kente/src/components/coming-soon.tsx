import { EmptyState, PageHeader } from "@/components/ui/card";

export function ComingSoon({ title, description, slice, children }: { title: string; description: string; slice: number; children: React.ReactNode }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState title={`${title} is being built`}>
        <p>{children}</p>
        <p className="mt-2 text-xs">Planned in slice {slice} of the build order.</p>
      </EmptyState>
    </>
  );
}
