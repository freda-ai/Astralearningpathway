import { periodRange, type Period } from "./dates";
import { isOverdue, type TaskLike } from "./tasks";

export interface DashTask extends TaskLike {
  id: string;
  title: string;
  assigneeStakeholderId: string | null;
  teamId: string | null;
  createdAt: Date | string;
  completedAt: Date | string | null;
  startDate: string | null;
}

export interface DashStakeholder {
  id: string;
  name: string;
  teamId: string | null;
}

export function taskCounts(tasks: TaskLike[], today: string) {
  const overdue = tasks.filter((t) => isOverdue(t, today)).length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  return { total: tasks.length, completed, overdue, pending: tasks.length - completed - overdue };
}

/** Tasks a stakeholder is accountable for: assigned directly, or via their team. */
function tasksFor<T extends DashTask>(s: DashStakeholder, tasks: T[]): T[] {
  return tasks.filter(
    (t) => t.assigneeStakeholderId === s.id || (t.assigneeStakeholderId === null && t.teamId !== null && t.teamId === s.teamId),
  );
}

export interface AccountabilityRow {
  stakeholderId: string;
  name: string;
  assigned: number;
  completed: number;
  overdue: number;
  incomplete: number;
  completionRate: number | null;
}

/** One row per stakeholder, sorted with the most overdue first. */
export function accountability(stakeholders: DashStakeholder[], tasks: DashTask[], today: string): AccountabilityRow[] {
  return stakeholders
    .map((s) => {
      const mine = tasksFor(s, tasks);
      const c = taskCounts(mine, today);
      return {
        stakeholderId: s.id,
        name: s.name,
        assigned: c.total,
        completed: c.completed,
        overdue: c.overdue,
        incomplete: c.total - c.completed,
        completionRate: c.total ? Math.round((c.completed / c.total) * 100) : null,
      };
    })
    .sort((a, b) => b.overdue - a.overdue || b.incomplete - a.incomplete || a.name.localeCompare(b.name));
}

const isoDay = (d: Date | string | null) => (d === null ? null : (typeof d === "string" ? d : d.toISOString()).slice(0, 10));

/** Activity in the chosen period: tasks completed, created, and coming due. */
export function periodActivity(tasks: DashTask[], period: Period, today: string) {
  const { start, end } = periodRange(period, today);
  const within = (d: string | null) => d !== null && d >= start && d <= end;
  return {
    start,
    end,
    completed: tasks.filter((t) => within(isoDay(t.completedAt))),
    created: tasks.filter((t) => within(isoDay(t.createdAt))),
    dueOpen: tasks.filter((t) => t.status !== "completed" && within(t.dueDate)),
  };
}

export function filterTasks<T extends DashTask>(
  tasks: T[],
  stakeholders: DashStakeholder[],
  filter: { teamId?: string | null; stakeholderId?: string | null },
): T[] {
  let out = tasks;
  if (filter.teamId) {
    const memberIds = new Set(stakeholders.filter((s) => s.teamId === filter.teamId).map((s) => s.id));
    out = out.filter((t) => t.teamId === filter.teamId || (t.assigneeStakeholderId !== null && memberIds.has(t.assigneeStakeholderId)));
  }
  if (filter.stakeholderId) {
    const s = stakeholders.find((x) => x.id === filter.stakeholderId);
    out = s ? tasksFor(s, out) : [];
  }
  return out;
}
