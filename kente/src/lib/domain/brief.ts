import type { MetricStatus } from "@/db/schema";
import { addDays, daysBetween, formatDate, periodRange, type Period } from "./dates";
import { isOverdue, type TaskLike } from "./tasks";

export interface BriefTask extends TaskLike {
  title: string;
  assigneeName: string | null;
  completedAt: Date | string | null;
}

export interface BriefMetric {
  title: string;
  status: MetricStatus;
  pct: number;
  deadline: string | null;
}

export interface Brief {
  done: string[];
  pending: string[];
  next: string[];
  atRisk: string[];
}

const PERIOD_WORDS: Record<Period, string> = { today: "today", week: "this week", month: "this month" };

function list(items: string[], max = 3): string {
  const shown = items.slice(0, max).map((t) => `“${t}”`);
  const extra = items.length - shown.length;
  if (extra > 0) shown.push(`${extra} more`);
  return shown.length <= 1 ? (shown[0] ?? "") : `${shown.slice(0, -1).join(", ")} and ${shown.at(-1)}`;
}

const day = (d: Date | string) => (typeof d === "string" ? d : d.toISOString()).slice(0, 10);

/**
 * A plain-English programme brief built only from programme data: what was
 * done, what is pending, recommended next steps and outcomes at risk.
 * Kente Pulse (slice 8) replaces the wording with an AI summary of the same facts.
 */
export function programmeBrief(tasks: BriefTask[], metrics: BriefMetric[], period: Period, today: string): Brief {
  const { start, end } = periodRange(period, today);
  const words = PERIOD_WORDS[period];

  const completed = tasks.filter((t) => t.completedAt && day(t.completedAt) >= start && day(t.completedAt) <= end);
  const open = tasks.filter((t) => t.status !== "completed");
  const overdue = open.filter((t) => isOverdue(t, today)).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const soon = open
    .filter((t) => t.dueDate && t.dueDate >= today && t.dueDate <= addDays(today, 7))
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const inProgress = open.filter((t) => t.status === "in_progress");

  const done = completed.length
    ? [`${completed.length} task${completed.length === 1 ? "" : "s"} completed ${words}: ${list(completed.map((t) => t.title))}.`]
    : [`No tasks completed ${words} yet.`];

  const pending: string[] = [];
  if (open.length === 0) pending.push(tasks.length ? "Every task is complete." : "No tasks have been planned yet.");
  else {
    pending.push(
      `${open.length} open task${open.length === 1 ? "" : "s"}, ${inProgress.length} in progress and ${overdue.length} overdue.`,
    );
    if (overdue.length) pending.push(`Overdue: ${list(overdue.map((t) => t.title))}.`);
  }

  const next: string[] = [];
  for (const t of overdue.slice(0, 2)) {
    const late = daysBetween(t.dueDate!, today);
    next.push(
      `Follow up on “${t.title}”${t.assigneeName ? ` with ${t.assigneeName}` : ""}, ${late} day${late === 1 ? "" : "s"} overdue.`,
    );
  }
  for (const t of soon.slice(0, 3 - next.length)) next.push(`“${t.title}” is due ${t.dueDate === today ? "today" : `on ${formatDate(t.dueDate)}`}.`);
  const unassigned = open.filter((t) => !t.assigneeName);
  if (next.length < 3 && unassigned.length) next.push(`Assign an owner to ${list(unassigned.map((t) => t.title), 2)}.`);
  if (next.length === 0) next.push(tasks.length ? "No deadlines in the next week." : "Plan the first tasks in the Log.");

  const atRisk = metrics
    .filter((m) => m.status === "at_risk" || m.status === "behind")
    .map((m) => `“${m.title}” is ${m.status === "behind" ? "behind" : "at risk"}: ${m.pct}% achieved${m.deadline ? `, deadline ${formatDate(m.deadline)}` : ""}.`);

  return { done, pending, next, atRisk };
}
