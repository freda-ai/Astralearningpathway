import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { PriorityFlag, TaskStatusBadge } from "@/components/ui/badge";
import { Card, EmptyState } from "@/components/ui/card";
import { addDays, daysBetween, formatDate } from "@/lib/domain/dates";
import { BOARD_COLUMNS, DISPLAY_STATUS_LABEL } from "@/lib/domain/tasks";
import { cn } from "@/lib/utils";
import { StatusSelect } from "./status-select";
import type { LogTask } from "./types";

type Href = (taskId: string) => string;

function MetricTag({ title }: { title: string }) {
  return (
    <span className="inline-block max-w-full truncate rounded bg-gold-soft px-1.5 py-0.5 text-[11px] font-medium text-gold-dark">
      {title}
    </span>
  );
}

export function ListView({ tasks, programmeId, href }: { tasks: LogTask[]; programmeId: string; href: Href }) {
  if (!tasks.length) return <EmptyState title="No tasks match">Try clearing the filters, or add a new task.</EmptyState>;
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="border-b border-line text-left text-xs tracking-wide text-muted uppercase">
          <tr>
            <th className="px-5 py-3 font-medium">Task</th>
            <th className="px-3 py-3 font-medium">Metric</th>
            <th className="px-3 py-3 font-medium">Assignee</th>
            <th className="px-3 py-3 font-medium">Due</th>
            <th className="px-3 py-3 font-medium">Priority</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className="border-b border-line last:border-0 hover:bg-cream/60" data-testid="task-row">
              <td className="px-5 py-3">
                <Link href={href(t.id)} scroll={false} className="font-medium hover:underline">
                  {t.title}
                </Link>
              </td>
              <td className="max-w-56 px-3 py-3">
                <MetricTag title={t.metricTitle} />
              </td>
              <td className="px-3 py-3">
                {t.assigneeName ? (
                  <span className="flex items-center gap-2">
                    <Avatar name={t.assigneeName} className="size-6 text-[10px]" />
                    {t.assigneeName}
                  </span>
                ) : (
                  <span className="text-muted">Unassigned</span>
                )}
              </td>
              <td className={cn("px-3 py-3 whitespace-nowrap", t.display === "overdue" && "font-medium text-terracotta")}>
                {formatDate(t.dueDate)}
              </td>
              <td className="px-3 py-3">
                <PriorityFlag priority={t.priority} />
              </td>
              <td className="px-5 py-3">
                {t.canUpdate ? (
                  <div className="flex items-center gap-2">
                    <StatusSelect programmeId={programmeId} taskId={t.id} status={t.status} label={`Status of ${t.title}`} />
                    {t.display === "overdue" && <TaskStatusBadge status="overdue" />}
                  </div>
                ) : (
                  <TaskStatusBadge status={t.display} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

const columnAccent = {
  pending: "border-t-ink/30",
  in_progress: "border-t-gold",
  completed: "border-t-forest",
  overdue: "border-t-terracotta",
} as const;

export function BoardView({ tasks, programmeId, href }: { tasks: LogTask[]; programmeId: string; href: Href }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {BOARD_COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.display === col);
        return (
          <section
            key={col}
            aria-label={DISPLAY_STATUS_LABEL[col]}
            className={cn("rounded-xl border border-t-4 border-line bg-ink/[0.025] p-3", columnAccent[col])}
          >
            <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-semibold">
              {DISPLAY_STATUS_LABEL[col]}
              <span className="rounded-full bg-paper px-2 text-xs text-muted">{items.length}</span>
            </h2>
            <ul className="space-y-2">
              {items.map((t) => (
                <li key={t.id} className="rounded-lg border border-line bg-paper p-3 shadow-sm" data-testid="task-card">
                  <Link href={href(t.id)} scroll={false} className="block text-sm font-medium hover:underline">
                    {t.title}
                  </Link>
                  <div className="mt-2">
                    <MetricTag title={t.metricTitle} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.assigneeName && <Avatar name={t.assigneeName} className="size-6 text-[10px]" />}
                      <span className={cn("text-xs", t.display === "overdue" ? "font-medium text-terracotta" : "text-muted")}>
                        {t.dueDate ? formatDate(t.dueDate) : "No due date"}
                      </span>
                    </div>
                    <PriorityFlag priority={t.priority} />
                  </div>
                  {t.canUpdate && (
                    <StatusSelect
                      className="mt-3"
                      programmeId={programmeId}
                      taskId={t.id}
                      status={t.status}
                      label={`Status of ${t.title}`}
                    />
                  )}
                </li>
              ))}
              {items.length === 0 && <li className="px-1 py-4 text-center text-xs text-muted">Nothing here</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

const barColour = {
  pending: "bg-ink/35",
  in_progress: "bg-gold",
  completed: "bg-forest",
  overdue: "bg-terracotta",
} as const;

export function TimelineView({ tasks, today, href }: { tasks: LogTask[]; today: string; href: Href }) {
  const dated = tasks.filter((t) => t.startDate || t.dueDate);
  const undated = tasks.length - dated.length;
  if (!dated.length)
    return <EmptyState title="Nothing to plot">Give tasks a start or due date to see them on the timeline.</EmptyState>;

  const starts = dated.map((t) => (t.startDate ?? t.dueDate)!);
  const ends = dated.map((t) => (t.dueDate ?? t.startDate)!);
  const min = addDays([...starts, today].sort()[0], -3);
  const max = addDays([...ends, today].sort().at(-1)!, 3);
  const span = Math.max(daysBetween(min, max), 1);
  const pos = (d: string) => (daysBetween(min, d) / span) * 100;

  const ticks: string[] = [];
  let m = `${min.slice(0, 7)}-01`;
  while (m <= max) {
    if (m >= min) ticks.push(m);
    const d = new Date(`${m}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + 1);
    m = d.toISOString().slice(0, 10);
  }

  const byMetric = new Map<string, LogTask[]>();
  for (const t of dated) byMetric.set(t.metricTitle, [...(byMetric.get(t.metricTitle) ?? []), t]);

  return (
    <Card className="overflow-x-auto p-5">
      <div className="min-w-[760px]">
        <div className="relative ml-56 h-6 border-b border-line text-[11px] text-muted">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: `${pos(t)}%` }}>
              {new Date(`${t}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" })}
            </span>
          ))}
        </div>
        {[...byMetric].map(([metric, items]) => (
          <div key={metric} className="mt-4">
            <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">{metric}</p>
            {items.map((t) => {
              const s = t.startDate ?? t.dueDate!;
              const e = t.dueDate ?? t.startDate!;
              return (
                <div key={t.id} className="flex h-9 items-center" data-testid="timeline-row">
                  <Link href={href(t.id)} scroll={false} className="w-56 shrink-0 truncate pr-3 text-sm hover:underline">
                    {t.title}
                  </Link>
                  <div className="relative h-full flex-1">
                    <div className="absolute inset-y-0 w-px bg-terracotta/60" style={{ left: `${pos(today)}%` }} aria-hidden />
                    <Link
                      href={href(t.id)}
                      scroll={false}
                      aria-label={`${t.title}: ${formatDate(s)} to ${formatDate(e)}`}
                      title={`${t.title}: ${formatDate(s)} – ${formatDate(e)}`}
                      className={cn("absolute top-2 h-5 min-w-2 rounded", barColour[t.display])}
                      style={{ left: `${pos(s)}%`, width: `${Math.max(((daysBetween(s, e) + 1) / span) * 100, 0.8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <p className="mt-4 ml-56 text-xs text-muted">
          <span className="mr-1 inline-block h-3 w-px bg-terracotta align-middle" /> Today
          {undated > 0 && ` · ${undated} task${undated === 1 ? "" : "s"} without dates not shown`}
        </p>
      </div>
    </Card>
  );
}
