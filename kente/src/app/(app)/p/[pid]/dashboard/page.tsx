import { CheckCircle2, Clock, ListTodo, TriangleAlert } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/ui/avatar";
import { MetricStatusBadge, metricColour } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { DashboardControls, RegenerateButton } from "@/components/dashboard/controls";
import { programmeBrief } from "@/lib/domain/brief";
import { accountability, filterTasks, periodActivity, taskCounts } from "@/lib/domain/dashboard";
import { formatDate, PERIOD_COOKIE, todayISO, type Period } from "@/lib/domain/dates";
import { deriveMetricStatus, metricProgress } from "@/lib/domain/metrics";
import { requireProgramme } from "@/lib/data/context";
import { loadProgrammeData, stakeholderName } from "@/lib/data/programme";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const PERIOD_LABEL: Record<Period, string> = { today: "Today", week: "This week", month: "This month" };
const isPeriod = (p: unknown): p is Period => p === "today" || p === "week" || p === "month";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ pid: string }>;
  searchParams: Promise<{ period?: string; team?: string; person?: string }>;
}) {
  const { pid } = await params;
  const sp = await searchParams;
  const saved = (await cookies()).get(PERIOD_COOKIE)?.value;
  const period: Period = isPeriod(sp.period) ? sp.period : isPeriod(saved) ? saved : "week";
  const { user, programme } = await requireProgramme(pid);
  const data = await loadProgrammeData(user.id, pid);
  const today = todayISO();

  const people = data.stakeholders.map((s) => ({ id: s.id, name: stakeholderName(s), teamId: s.teamId }));
  const nameOf = new Map(people.map((p) => [p.id, p.name]));
  const teamOf = new Map(data.teams.map((t) => [t.id, t.name]));
  const tasks = filterTasks(data.tasks, people, { teamId: sp.team, stakeholderId: sp.person });
  const filtered = Boolean(sp.team || sp.person);

  const counts = taskCounts(tasks, today);
  const activity = periodActivity(tasks, period, today);
  const metricRows = data.metrics.map((m) => {
    const linked = tasks.filter((t) => t.metricId === m.id);
    const all = data.tasks.filter((t) => t.metricId === m.id);
    return { m, p: metricProgress(m, linked, today), status: deriveMetricStatus(m, all, today) };
  });
  const brief = programmeBrief(
    tasks.map((t) => ({
      ...t,
      assigneeName: (t.assigneeStakeholderId && nameOf.get(t.assigneeStakeholderId)) || (t.teamId && teamOf.get(t.teamId)) || null,
    })),
    metricRows.map(({ m, p, status }) => ({ title: m.title, status, pct: p.pct, deadline: m.deadline })),
    period,
    today,
  );
  const scopedPeople = sp.person ? people.filter((p) => p.id === sp.person) : sp.team ? people.filter((p) => p.teamId === sp.team) : people;
  const rows = accountability(scopedPeople, tasks, today);

  const stats = [
    { label: "Total tasks", value: counts.total, icon: ListTodo, tone: "text-ink" },
    { label: "Completed", value: counts.completed, icon: CheckCircle2, tone: "text-forest" },
    { label: "Pending", value: counts.pending, icon: Clock, tone: "text-gold-dark" },
    { label: "Overdue", value: counts.overdue, icon: TriangleAlert, tone: "text-terracotta" },
  ];

  return (
    <>
      <PageHeader
        title={programme.name}
        description={`Dashboard · ${formatDate(today)}${filtered ? " · filtered" : ""}`}
      />
      <Suspense>
        <DashboardControls
          period={period}
          teams={data.teams.map((t) => ({ id: t.id, name: t.name }))}
          people={people.map(({ id, name }) => ({ id, name }))}
        />
      </Suspense>

      <section aria-label="Task counts" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card
            key={label}
            data-testid={`stat-${label.toLowerCase().replace(" ", "-")}`}
            className={cn(label === "Overdue" && value > 0 && "border-terracotta/40 bg-terracotta-soft/40")}
          >
            <CardBody className="flex items-start justify-between">
              <div>
                <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
                <p className={cn("mt-1 font-display text-3xl font-semibold tabular-nums", tone)}>{value}</p>
              </div>
              <Icon className={cn("size-5", tone)} aria-hidden />
            </CardBody>
          </Card>
        ))}
      </section>

      <p className="mb-6 text-sm text-muted" data-testid="activity">
        <span className="font-medium text-ink">{PERIOD_LABEL[period]}:</span> {activity.completed.length} completed ·{" "}
        {activity.created.length} added · {activity.dueOpen.length} open task{activity.dueOpen.length === 1 ? "" : "s"} due
        {period === "today" ? " today" : ` by ${formatDate(activity.end)}`}
      </p>

      <div className="mb-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Metric progress</CardTitle>
            <Link href={`/p/${pid}/metrics`} className="text-sm text-muted hover:text-ink">
              All outcomes
            </Link>
          </CardHeader>
          <CardBody>
            {metricRows.length === 0 ? (
              <EmptyState title="No outcomes yet">Define the programme&rsquo;s outcomes in Metric to track progress here.</EmptyState>
            ) : (
              <ul className="space-y-5">
                {metricRows.map(({ m, p, status }) => (
                  <li key={m.id} data-testid="metric-progress">
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <Link href={`/p/${pid}/metrics/${m.id}`} className="min-w-0 truncate font-medium hover:underline">
                        {m.title}
                      </Link>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="tabular-nums">{p.pct}%</span>
                        <MetricStatusBadge status={status} />
                      </span>
                    </div>
                    <ProgressBar pct={p.pct} colour={metricColour[status]} label={m.title} />
                    <p className="mt-1 text-xs text-muted">
                      {p.tasksCompleted} of {p.tasksPlanned} tasks done{m.deadline ? ` · deadline ${formatDate(m.deadline)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2" aria-labelledby="brief-title" data-testid="brief">
          <CardHeader>
            <div>
              <CardTitle id="brief-title">Programme brief</CardTitle>
              <p className="text-xs text-muted">{PERIOD_LABEL[period]}, from programme data</p>
            </div>
            <RegenerateButton />
          </CardHeader>
          <CardBody className="space-y-4 text-sm">
            {(
              [
                ["Done", brief.done, "bg-forest"],
                ["Pending", brief.pending, "bg-gold"],
                ["Next steps", brief.next, "bg-ink"],
                ...(brief.atRisk.length ? ([["At risk", brief.atRisk, "bg-terracotta"]] as const) : []),
              ] as const
            ).map(([title, lines, dot]) => (
              <div key={title}>
                <h3 className="mb-1 flex items-center gap-2 font-sans text-xs font-semibold tracking-wide uppercase">
                  <span className={cn("size-2 rounded-full", dot)} aria-hidden />
                  {title}
                </h3>
                <ul className="space-y-1 text-ink/85">
                  {lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Team accountability</CardTitle>
          <span className="text-xs text-muted">Most overdue first</span>
        </CardHeader>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-medium">Stakeholder</th>
              <th className="px-3 py-3 text-right font-medium">Assigned</th>
              <th className="px-3 py-3 text-right font-medium">Completed</th>
              <th className="px-3 py-3 text-right font-medium">Incomplete</th>
              <th className="px-5 py-3 text-right font-medium">Overdue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.stakeholderId} className="border-b border-line last:border-0" data-testid="accountability-row">
                <td className="px-5 py-3">
                  <Link href={`/p/${pid}/stakeholders/${r.stakeholderId}`} className="flex items-center gap-2 hover:underline">
                    <Avatar name={r.name} className="size-6 text-[10px]" />
                    {r.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{r.assigned}</td>
                <td className="px-3 py-3 text-right tabular-nums">{r.completed}</td>
                <td className="px-3 py-3 text-right tabular-nums">{r.incomplete}</td>
                <td className={cn("px-5 py-3 text-right tabular-nums", r.overdue > 0 && "font-semibold text-terracotta")}>{r.overdue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
