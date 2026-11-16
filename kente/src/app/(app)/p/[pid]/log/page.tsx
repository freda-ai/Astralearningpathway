import { asc, eq } from "drizzle-orm";
import { Suspense } from "react";
import { asUser } from "@/db";
import { taskComments, users } from "@/db/schema";
import { PageHeader } from "@/components/ui/card";
import { FilterBar } from "@/components/log/filter-bar";
import { NewTaskButton } from "@/components/log/new-task";
import { TaskDrawer, type CommentView } from "@/components/log/task-drawer";
import type { LogOptions, LogTask } from "@/components/log/types";
import { BoardView, ListView, TimelineView } from "@/components/log/views";
import { displayName } from "@/lib/auth/session";
import { todayISO } from "@/lib/domain/dates";
import { displayStatus } from "@/lib/domain/tasks";
import { requireProgramme } from "@/lib/data/context";
import { loadProgrammeData, stakeholderName } from "@/lib/data/programme";

export const metadata = { title: "Log" };

type Search = { view?: string; metric?: string; who?: string; status?: string; q?: string; task?: string };

export default async function LogPage({ params, searchParams }: { params: Promise<{ pid: string }>; searchParams: Promise<Search> }) {
  const { pid } = await params;
  const sp = await searchParams;
  const view = sp.view === "board" || sp.view === "timeline" ? sp.view : "list";
  const { user, canManage, role } = await requireProgramme(pid);
  const data = await loadProgrammeData(user.id, pid);
  const today = todayISO();

  const metricTitle = new Map(data.metrics.map((m) => [m.id, m.title]));
  const people = new Map(data.stakeholders.map((s) => [s.id, s]));
  const teamName = new Map(data.teams.map((t) => [t.id, t.name]));
  const me = data.stakeholders.find((s) => s.userId === user.id);

  const all: LogTask[] = data.tasks.map((t) => {
    const assignee = t.assigneeStakeholderId ? `s:${t.assigneeStakeholderId}` : t.teamId ? `t:${t.teamId}` : null;
    const person = t.assigneeStakeholderId ? people.get(t.assigneeStakeholderId) : undefined;
    const mine = (person && person.userId === user.id) || (!!t.teamId && me?.teamId === t.teamId);
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      metricId: t.metricId,
      metricTitle: metricTitle.get(t.metricId) ?? "—",
      assignee,
      assigneeName: person ? stakeholderName(person) : t.teamId ? `${teamName.get(t.teamId)} (team)` : null,
      startDate: t.startDate,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      display: displayStatus(t, today),
      completedAt: t.completedAt?.toISOString() ?? null,
      canUpdate: canManage || !!mine,
    };
  });

  const q = sp.q?.trim().toLowerCase();
  const tasks = all.filter(
    (t) =>
      (!sp.metric || t.metricId === sp.metric) &&
      (!sp.who || t.assignee === sp.who || (sp.who.startsWith("s:") && people.get(sp.who.slice(2))?.teamId && t.assignee === `t:${people.get(sp.who.slice(2))!.teamId}`)) &&
      (!sp.status || t.display === sp.status) &&
      (!q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)),
  );

  const options: LogOptions = {
    metrics: data.metrics.map((m) => ({ id: m.id, name: m.title })),
    people: data.stakeholders.map((s) => ({ id: s.id, name: stakeholderName(s) })),
    teams: data.teams.map((t) => ({ id: t.id, name: t.name })),
  };

  const open = sp.task ? (all.find((t) => t.id === sp.task) ?? null) : null;
  let comments: CommentView[] = [];
  if (open) {
    const rows = await asUser(user.id, (tx) =>
      tx
        .select({ id: taskComments.id, body: taskComments.body, createdAt: taskComments.createdAt, name: users.name, email: users.email })
        .from(taskComments)
        .leftJoin(users, eq(users.id, taskComments.authorId))
        .where(eq(taskComments.taskId, open.id))
        .orderBy(asc(taskComments.createdAt)),
    );
    comments = rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      author: r.email ? displayName({ name: r.name, email: r.email }) : "Former member",
    }));
  }

  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => k !== "task" && v) as [string, string][]);
  const href = (id: string) => `/p/${pid}/log?${new URLSearchParams([...qs, ["task", id]])}`;

  return (
    <>
      <PageHeader
        title="Log"
        description={`${all.length} task${all.length === 1 ? "" : "s"}. Every task is attached to a metric.`}
        actions={canManage && <NewTaskButton programmeId={pid} options={options} defaultMetricId={sp.metric} />}
      />
      <Suspense>
        <FilterBar options={options} view={view} />
      </Suspense>
      {view === "list" && <ListView tasks={tasks} programmeId={pid} href={href} />}
      {view === "board" && <BoardView tasks={tasks} programmeId={pid} href={href} />}
      {view === "timeline" && <TimelineView tasks={tasks} today={today} href={href} />}
      <Suspense>
        <TaskDrawer
          programmeId={pid}
          task={open}
          comments={comments}
          options={options}
          canManage={canManage}
          canComment={role !== "viewer"}
        />
      </Suspense>
    </>
  );
}
