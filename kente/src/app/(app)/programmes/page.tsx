import { count, inArray } from "drizzle-orm";
import { CalendarRange } from "lucide-react";
import Link from "next/link";
import { asUser } from "@/db";
import { metrics, tasks } from "@/db/schema";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { NewProgrammeButton } from "@/components/programmes/new-programme";
import { formatDate } from "@/lib/domain/dates";
import { listProgrammes, requireWorkspace } from "@/lib/data/context";

export const metadata = { title: "Programmes" };

export default async function ProgrammesPage() {
  const { user, workspace } = await requireWorkspace();
  const list = await listProgrammes(user.id, workspace.id);
  const canCreate = workspace.role === "owner" || workspace.role === "lead";
  const ids = list.map((p) => p.id);

  const [metricCounts, taskCounts] = ids.length
    ? await asUser(user.id, (tx) =>
        Promise.all([
          tx.select({ pid: metrics.programmeId, n: count() }).from(metrics).where(inArray(metrics.programmeId, ids)).groupBy(metrics.programmeId),
          tx.select({ pid: tasks.programmeId, n: count() }).from(tasks).where(inArray(tasks.programmeId, ids)).groupBy(tasks.programmeId),
        ]),
      )
    : [[], []];
  const m = new Map(metricCounts.map((r) => [r.pid, r.n]));
  const t = new Map(taskCounts.map((r) => [r.pid, r.n]));

  return (
    <>
      <PageHeader
        title="Programmes"
        description={`${workspace.name} · ${list.length} programme${list.length === 1 ? "" : "s"}`}
        actions={canCreate && <NewProgrammeButton workspaceId={workspace.id} />}
      />
      {list.length === 0 ? (
        <EmptyState title="No programmes yet">
          {canCreate
            ? "Create your first programme, then set its outcomes in Metric and plan the work in Log."
            : "You haven’t been added to a programme yet. Ask your programme lead for an invite."}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                href={`/p/${p.id}/dashboard`}
                className="block h-full rounded-xl border border-line bg-paper p-5 transition-shadow hover:shadow-md"
              >
                <h2 className="text-lg font-semibold">{p.name}</h2>
                {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p>}
                <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
                  <CalendarRange className="size-3.5" />
                  {formatDate(p.startDate)} – {formatDate(p.endDate)}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">{m.get(p.id) ?? 0}</span> <span className="text-muted">metrics</span>
                  <span className="mx-2 text-line">|</span>
                  <span className="font-medium">{t.get(p.id) ?? 0}</span> <span className="text-muted">tasks</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
