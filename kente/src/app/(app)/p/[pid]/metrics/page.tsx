import Link from "next/link";
import { MetricStatusBadge, metricColour } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress";
import { MetricButton } from "@/components/metrics/metric-form";
import { formatDate, todayISO } from "@/lib/domain/dates";
import { deriveMetricStatus, metricProgress } from "@/lib/domain/metrics";
import { requireProgramme } from "@/lib/data/context";
import { loadProgrammeData } from "@/lib/data/programme";

export const metadata = { title: "Metric" };

const fmt = (n: number | null, unit: string | null) => (n === null ? "—" : `${n.toLocaleString("en-GB")}${unit ? ` ${unit}` : ""}`);

export default async function MetricsPage({ params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const { user, canManage } = await requireProgramme(pid);
  const data = await loadProgrammeData(user.id, pid);
  const today = todayISO();

  return (
    <>
      <PageHeader
        title="Metric"
        description="The programme’s outcomes. Every task in the Log rolls up to one of these."
        actions={canManage && <MetricButton programmeId={pid} />}
      />
      {data.metrics.length === 0 ? (
        <EmptyState title="No outcomes yet">
          Start by defining what the programme must achieve, with a target and a deadline. Tasks can only be created once
          an outcome exists.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.metrics.map((m) => {
            const mt = data.tasks.filter((t) => t.metricId === m.id);
            const p = metricProgress(m, mt, today);
            const status = deriveMetricStatus(m, mt, today);
            return (
              <li key={m.id}>
                <Link
                  href={`/p/${pid}/metrics/${m.id}`}
                  data-testid="metric-card"
                  className="flex h-full flex-col rounded-xl border border-line bg-paper p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base leading-snug font-semibold">{m.title}</h2>
                    <MetricStatusBadge status={status} />
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <ProgressRing pct={p.pct} colour={metricColour[status]} />
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <dt className="text-muted">Target</dt>
                      <dd className="font-medium">{fmt(m.target, m.unit)}</dd>
                      <dt className="text-muted">Current</dt>
                      <dd className="font-medium">{fmt(m.current, m.unit)}</dd>
                      <dt className="text-muted">Tasks</dt>
                      <dd className="font-medium">
                        {p.tasksCompleted}/{p.tasksPlanned}
                      </dd>
                    </dl>
                  </div>
                  <p className="mt-auto pt-4 text-xs text-muted">Deadline {formatDate(m.deadline)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
