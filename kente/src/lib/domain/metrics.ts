import type { MetricStatus } from "@/db/schema";
import { daysBetween } from "./dates";
import { isOverdue, type TaskLike } from "./tasks";

export interface MetricLike {
  target: number | null;
  baseline: number | null;
  current: number | null;
  deadline: string | null;
  createdAt: Date | string;
}

export interface MetricProgress {
  /** Progress towards the target value, when a target and current value exist. */
  valuePct: number | null;
  tasksCompleted: number;
  tasksPlanned: number;
  tasksOverdue: number;
  /** Completed tasks as a share of planned tasks. */
  taskPct: number | null;
  /** The headline figure: value progress if measured, otherwise task progress. */
  pct: number;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function metricProgress(metric: MetricLike, tasks: TaskLike[], today: string): MetricProgress {
  const tasksPlanned = tasks.length;
  const tasksCompleted = tasks.filter((t) => t.status === "completed").length;
  const tasksOverdue = tasks.filter((t) => isOverdue(t, today)).length;
  const taskPct = tasksPlanned ? (tasksCompleted / tasksPlanned) * 100 : null;

  let valuePct: number | null = null;
  if (metric.target !== null && metric.current !== null) {
    const base = metric.baseline ?? 0;
    const span = metric.target - base;
    valuePct = span === 0 ? (metric.current >= metric.target ? 100 : 0) : clamp(((metric.current - base) / span) * 100);
  }

  const pct = Math.round(valuePct ?? taskPct ?? 0);
  return {
    valuePct: valuePct === null ? null : Math.round(valuePct),
    tasksCompleted,
    tasksPlanned,
    tasksOverdue,
    taskPct: taskPct === null ? null : Math.round(taskPct),
    pct,
  };
}

/**
 * Derives a metric's status from its progress, its deadline and its tasks.
 *
 * - Achieved: progress has reached 100%.
 * - Behind: the deadline has passed, or at least half of the open tasks are overdue.
 * - At risk: any task is overdue, or progress trails elapsed time by more than 25 points.
 * - On track: otherwise.
 */
export function deriveMetricStatus(metric: MetricLike, tasks: TaskLike[], today: string): MetricStatus {
  const p = metricProgress(metric, tasks, today);
  const measured = p.valuePct !== null || p.tasksPlanned > 0;
  if (measured && p.pct >= 100) return "achieved";
  if (metric.deadline && metric.deadline < today) return "behind";

  const open = p.tasksPlanned - p.tasksCompleted;
  if (open > 0 && p.tasksOverdue / open >= 0.5) return "behind";
  if (p.tasksOverdue > 0) return "at_risk";

  if (metric.deadline && measured) {
    const start = (typeof metric.createdAt === "string" ? metric.createdAt : metric.createdAt.toISOString()).slice(0, 10);
    const total = daysBetween(start, metric.deadline);
    if (total > 0) {
      const elapsedPct = clamp((daysBetween(start, today) / total) * 100);
      if (elapsedPct - p.pct > 25) return "at_risk";
    }
  }
  return "on_track";
}

export const METRIC_STATUS_LABEL: Record<MetricStatus, string> = {
  on_track: "On track",
  at_risk: "At risk",
  behind: "Behind",
  achieved: "Achieved",
};

export interface SeriesPoint {
  date: string;
  pct: number;
}

const day = (d: Date | string) => (typeof d === "string" ? d : d.toISOString()).slice(0, 10);

/**
 * Progress over time for the outcome chart. Uses manual value entries when the
 * metric is measured against a target, otherwise cumulative task completions.
 */
export function progressSeries(
  metric: MetricLike,
  tasks: { status: string; completedAt: Date | string | null }[],
  updates: { value: number; createdAt: Date | string }[],
  today: string,
): SeriesPoint[] {
  const points: SeriesPoint[] = [{ date: day(metric.createdAt), pct: 0 }];
  if (metric.target !== null && updates.length) {
    const base = metric.baseline ?? 0;
    const span = metric.target - base;
    for (const u of [...updates].sort((a, b) => day(a.createdAt).localeCompare(day(b.createdAt)))) {
      const pct = span === 0 ? (u.value >= metric.target ? 100 : 0) : clamp(((u.value - base) / span) * 100);
      points.push({ date: day(u.createdAt), pct: Math.round(pct) });
    }
  } else if (tasks.length) {
    const done = tasks
      .filter((t) => t.status === "completed" && t.completedAt)
      .map((t) => day(t.completedAt!))
      .sort();
    done.forEach((d, i) => points.push({ date: d, pct: Math.round(((i + 1) / tasks.length) * 100) }));
  }
  // One point per day (the latest wins), carried forward to today.
  const byDay = new Map<string, number>();
  for (const p of points) byDay.set(p.date, p.pct);
  const out = [...byDay].map(([date, pct]) => ({ date, pct })).sort((a, b) => a.date.localeCompare(b.date));
  const last = out[out.length - 1];
  if (last.date < today) out.push({ date: today, pct: last.pct });
  return out;
}
