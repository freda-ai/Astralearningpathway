import { describe, expect, it } from "vitest";
import { accountability, filterTasks, periodActivity, taskCounts, type DashTask } from "@/lib/domain/dashboard";
import { addDays, periodRange, todayISO } from "@/lib/domain/dates";
import { deriveMetricStatus, metricProgress } from "@/lib/domain/metrics";
import { displayStatus, isOverdue } from "@/lib/domain/tasks";

const today = "2026-11-18"; // a Wednesday

const task = (over: Partial<DashTask> = {}): DashTask => ({
  id: Math.random().toString(36).slice(2),
  title: "Task",
  status: "pending",
  dueDate: null,
  startDate: null,
  assigneeStakeholderId: null,
  teamId: null,
  createdAt: "2026-11-01T09:00:00Z",
  completedAt: null,
  ...over,
});

describe("overdue", () => {
  it("is overdue only when due before today and not completed", () => {
    expect(isOverdue(task({ dueDate: "2026-11-17" }), today)).toBe(true);
    expect(isOverdue(task({ dueDate: today }), today)).toBe(false);
    expect(isOverdue(task({ dueDate: "2026-11-17", status: "completed" }), today)).toBe(false);
    expect(isOverdue(task({ dueDate: null }), today)).toBe(false);
  });

  it("shows overdue as a display status", () => {
    expect(displayStatus(task({ dueDate: "2026-11-01", status: "in_progress" }), today)).toBe("overdue");
    expect(displayStatus(task({ status: "in_progress" }), today)).toBe("in_progress");
  });
});

describe("dates", () => {
  it("computes periods with Monday-start weeks", () => {
    expect(periodRange("today", today)).toEqual({ start: today, end: today });
    expect(periodRange("week", today)).toEqual({ start: "2026-11-16", end: "2026-11-22" });
    expect(periodRange("month", today)).toEqual({ start: "2026-11-01", end: "2026-11-30" });
    expect(periodRange("month", "2028-02-10")).toEqual({ start: "2028-02-01", end: "2028-02-29" });
  });

  it("adds days and formats today", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(todayISO("UTC", new Date("2026-11-18T23:30:00Z"))).toBe("2026-11-18");
    expect(todayISO("Africa/Lagos", new Date("2026-11-18T23:30:00Z"))).toBe("2026-11-19");
  });
});

describe("metric progress", () => {
  const metric = { target: 500, baseline: 0, current: null, deadline: "2027-06-30", createdAt: "2026-11-01T00:00:00Z" };

  it("rolls up completed tasks when no value is measured", () => {
    const tasks = [task({ status: "completed" }), task(), task(), task({ status: "completed" })];
    const p = metricProgress(metric, tasks, today);
    expect(p).toMatchObject({ tasksCompleted: 2, tasksPlanned: 4, taskPct: 50, valuePct: null, pct: 50 });
  });

  it("prefers the measured value against baseline and target", () => {
    const p = metricProgress({ ...metric, baseline: 100, current: 300 }, [task()], today);
    expect(p.valuePct).toBe(50);
    expect(p.pct).toBe(50);
  });

  it("clamps value progress to 0–100", () => {
    expect(metricProgress({ ...metric, current: 900 }, [], today).pct).toBe(100);
    expect(metricProgress({ ...metric, current: -5 }, [], today).pct).toBe(0);
  });

  it("is zero with nothing to measure", () => {
    expect(metricProgress(metric, [], today).pct).toBe(0);
  });
});

describe("metric status", () => {
  const base = { target: null, baseline: null, current: null, deadline: null, createdAt: "2026-11-01T00:00:00Z" };

  it("is achieved at 100%", () => {
    expect(deriveMetricStatus(base, [task({ status: "completed" })], today)).toBe("achieved");
  });

  it("is on track with no tasks and no deadline", () => {
    expect(deriveMetricStatus(base, [], today)).toBe("on_track");
  });

  it("is behind once the deadline passes", () => {
    expect(deriveMetricStatus({ ...base, deadline: "2026-11-10" }, [task()], today)).toBe("behind");
  });

  it("is at risk with an overdue task, behind when half the open tasks are overdue", () => {
    const overdue = task({ dueDate: "2026-11-10" });
    expect(deriveMetricStatus(base, [overdue, task(), task()], today)).toBe("at_risk");
    expect(deriveMetricStatus(base, [overdue, task()], today)).toBe("behind");
  });

  it("is at risk when progress trails elapsed time", () => {
    // 17 of 30 days elapsed (57%), 0% done
    expect(deriveMetricStatus({ ...base, deadline: "2026-12-01" }, [task(), task()], today)).toBe("at_risk");
    expect(deriveMetricStatus({ ...base, deadline: "2027-12-01" }, [task(), task()], today)).toBe("on_track");
  });
});

describe("dashboard", () => {
  const ada = { id: "ada", name: "Ada", teamId: "t1" };
  const ben = { id: "ben", name: "Ben", teamId: null };
  const tasks = [
    task({ assigneeStakeholderId: "ada", status: "completed", completedAt: "2026-11-17T10:00:00Z" }),
    task({ assigneeStakeholderId: "ben", dueDate: "2026-11-10" }),
    task({ assigneeStakeholderId: "ben", dueDate: "2026-11-12" }),
    task({ teamId: "t1", dueDate: "2026-11-20" }),
  ];

  it("counts total, completed, pending and overdue", () => {
    expect(taskCounts(tasks, today)).toEqual({ total: 4, completed: 1, pending: 1, overdue: 2 });
  });

  it("sorts accountability by overdue first and counts team tasks", () => {
    const rows = accountability([ada, ben], tasks, today);
    expect(rows.map((r) => r.name)).toEqual(["Ben", "Ada"]);
    expect(rows[1]).toMatchObject({ assigned: 2, completed: 1, overdue: 0, completionRate: 50 });
  });

  it("summarises activity in a period", () => {
    const week = periodActivity(tasks, "week", today);
    expect(week.completed).toHaveLength(1);
    expect(week.dueOpen).toHaveLength(1);
    expect(periodActivity(tasks, "today", today).completed).toHaveLength(0);
  });

  it("filters by team and stakeholder", () => {
    expect(filterTasks(tasks, [ada, ben], { teamId: "t1" })).toHaveLength(2);
    expect(filterTasks(tasks, [ada, ben], { stakeholderId: "ben" })).toHaveLength(2);
  });
});

describe("progress series", () => {
  const metric = { target: 100, baseline: 0, current: null, deadline: null, createdAt: "2026-11-01T00:00:00Z" };
  it("uses cumulative completions when there are no value entries", async () => {
    const { progressSeries } = await import("@/lib/domain/metrics");
    const s = progressSeries(
      metric,
      [
        { status: "completed", completedAt: "2026-11-05T10:00:00Z" },
        { status: "completed", completedAt: "2026-11-05T12:00:00Z" },
        { status: "pending", completedAt: null },
        { status: "pending", completedAt: null },
      ],
      [],
      today,
    );
    expect(s).toEqual([
      { date: "2026-11-01", pct: 0 },
      { date: "2026-11-05", pct: 50 },
      { date: today, pct: 50 },
    ]);
  });

  it("uses value entries when measured against a target", async () => {
    const { progressSeries } = await import("@/lib/domain/metrics");
    const s = progressSeries(metric, [], [{ value: 40, createdAt: "2026-11-10T00:00:00Z" }, { value: 25, createdAt: "2026-11-08T00:00:00Z" }], "2026-11-10");
    expect(s.map((p) => p.pct)).toEqual([0, 25, 40]);
  });
});

describe("programme brief", () => {
  it("summarises done, pending, next steps and at-risk outcomes from the data only", async () => {
    const { programmeBrief } = await import("@/lib/domain/brief");
    const b = programmeBrief(
      [
        { title: "Recruit cohort", status: "completed", dueDate: "2026-11-15", completedAt: "2026-11-17T09:00:00Z", assigneeName: "Ada" },
        { title: "Book venue", status: "pending", dueDate: "2026-11-10", completedAt: null, assigneeName: "Ben" },
        { title: "Print materials", status: "in_progress", dueDate: "2026-11-20", completedAt: null, assigneeName: null },
      ],
      [
        { title: "Train 500 founders", status: "behind", pct: 12, deadline: "2027-06-30" },
        { title: "Raise funds", status: "on_track", pct: 40, deadline: null },
      ],
      "week",
      today,
    );
    expect(b.done).toEqual(["1 task completed this week: “Recruit cohort”."]);
    expect(b.pending[0]).toBe("2 open tasks, 1 in progress and 1 overdue.");
    expect(b.next[0]).toBe("Follow up on “Book venue” with Ben, 8 days overdue.");
    expect(b.next[1]).toBe("“Print materials” is due on 20 Nov 2026.");
    expect(b.next[2]).toBe("Assign an owner to “Print materials”.");
    expect(b.atRisk).toEqual(["“Train 500 founders” is behind: 12% achieved, deadline 30 Jun 2027."]);
  });

  it("handles an empty programme", async () => {
    const { programmeBrief } = await import("@/lib/domain/brief");
    const b = programmeBrief([], [], "today", today);
    expect(b).toEqual({
      done: ["No tasks completed today yet."],
      pending: ["No tasks have been planned yet."],
      next: ["Plan the first tasks in the Log."],
      atRisk: [],
    });
  });
});
