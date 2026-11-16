import { asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asUser } from "@/db";
import { metricUpdates } from "@/db/schema";
import { MetricStatusBadge, TaskStatusBadge, metricColour } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle, EmptyState } from "@/components/ui/card";
import { DeleteMetricForm } from "@/components/metrics/delete-metric";
import { MetricButton } from "@/components/metrics/metric-form";
import { ProgressChart } from "@/components/metrics/progress-chart";
import { ProgressForm } from "@/components/metrics/progress-form";
import { formatDate, todayISO } from "@/lib/domain/dates";
import { deriveMetricStatus, metricProgress, progressSeries } from "@/lib/domain/metrics";
import { displayStatus } from "@/lib/domain/tasks";
import { requireProgramme } from "@/lib/data/context";
import { loadProgrammeData, stakeholderName } from "@/lib/data/programme";

export const metadata = { title: "Outcome" };

export default async function OutcomePage({ params }: { params: Promise<{ pid: string; mid: string }> }) {
  const { pid, mid } = await params;
  const { user, canManage } = await requireProgramme(pid);
  const data = await loadProgrammeData(user.id, pid);
  const m = data.metrics.find((x) => x.id === mid);
  if (!m) notFound();
  const updates = await asUser(user.id, (tx) =>
    tx.select().from(metricUpdates).where(eq(metricUpdates.metricId, mid)).orderBy(asc(metricUpdates.createdAt)),
  );
  const today = todayISO();
  const linked = data.tasks.filter((t) => t.metricId === mid);
  const p = metricProgress(m, linked, today);
  const status = deriveMetricStatus(m, linked, today);
  const series = progressSeries(m, linked, updates, today);
  const who = new Map(data.stakeholders.map((s) => [s.id, stakeholderName(s)]));
  const team = new Map(data.teams.map((t) => [t.id, t.name]));
  const unit = m.unit ? ` ${m.unit}` : "";

  return (
    <>
      <Link href={`/p/${pid}/metrics`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Metric
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{m.title}</h1>
            <MetricStatusBadge status={status} />
          </div>
          {m.description && <p className="mt-2 text-sm text-muted">{m.description}</p>}
        </div>
        {canManage && <MetricButton programmeId={pid} metric={m} />}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Achieved", `${p.pct}%`],
          ["Current / target", m.target === null ? "—" : `${(m.current ?? m.baseline ?? 0).toLocaleString("en-GB")} / ${m.target.toLocaleString("en-GB")}${unit}`],
          ["Tasks completed", `${p.tasksCompleted} of ${p.tasksPlanned}`],
          ["Deadline", formatDate(m.deadline)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardBody>
              <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
              <p className="mt-1 font-display text-xl font-semibold">{value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Progress over time</CardTitle>
              <span className="text-xs text-muted">
                {p.valuePct !== null ? "From recorded values" : "From completed tasks"}
              </span>
            </CardHeader>
            <CardBody>
              <ProgressChart series={series} colour={metricColour[status]} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked activities</CardTitle>
              <Link href={`/p/${pid}/log?metric=${mid}`} className="text-sm text-muted hover:text-ink">
                Open in Log
              </Link>
            </CardHeader>
            {linked.length === 0 ? (
              <CardBody>
                <EmptyState title="No tasks yet">Add tasks in the Log and link them to this outcome.</EmptyState>
              </CardBody>
            ) : (
              <ul className="divide-y divide-line">
                {linked.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <Link href={`/p/${pid}/log?task=${t.id}`} className="font-medium hover:underline">
                        {t.title}
                      </Link>
                      <p className="text-xs text-muted">
                        {(t.assigneeStakeholderId && who.get(t.assigneeStakeholderId)) || (t.teamId && team.get(t.teamId)) || "Unassigned"}
                        {" · "}
                        {t.status === "completed" ? `Completed ${formatDate(t.completedAt?.toISOString())}` : `Due ${formatDate(t.dueDate)}`}
                      </p>
                    </div>
                    <TaskStatusBadge status={displayStatus(t, today)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Record progress</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="mb-3 text-sm text-muted">For outcomes measured outside Kente, such as survey results or headcounts.</p>
                <ProgressForm programmeId={pid} metricId={mid} unit={m.unit} />
              </CardBody>
            </Card>
          )}
          {updates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recorded values</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-line text-sm">
                {[...updates].reverse().map((u) => (
                  <li key={u.id} className="px-5 py-2.5">
                    <span className="font-medium">
                      {u.value.toLocaleString("en-GB")}
                      {unit}
                    </span>
                    <span className="text-muted"> · {formatDate(u.createdAt.toISOString())}</span>
                    {u.note && <p className="text-xs text-muted">{u.note}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {canManage && <DeleteMetricForm programmeId={pid} metricId={mid} />}
        </div>
      </div>
    </>
  );
}
