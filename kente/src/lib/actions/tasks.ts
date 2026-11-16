"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { asUser } from "@/db";
import { programmes, taskComments, tasks, TASK_STATUSES } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { recomputeMetricStatuses } from "./recompute";
import { dbError, emptyToNull, type ActionState } from "./state";

const taskSchema = z
  .object({
    programmeId: z.string().uuid(),
    // Every task must be attached to a metric.
    metricId: z.string({ message: "Choose the metric this task contributes to" }).uuid("Choose the metric this task contributes to"),
    title: z.string().trim().min(2, "Give the task a title").max(200),
    description: z.preprocess(emptyToNull, z.string().trim().max(5000).nullable()),
    assignee: z.preprocess(emptyToNull, z.string().regex(/^[st]:[0-9a-f-]{36}$/).nullable()),
    startDate: z.preprocess(emptyToNull, z.string().date().nullable()),
    dueDate: z.preprocess(emptyToNull, z.string().date().nullable()),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    status: z.enum(TASK_STATUSES).default("pending"),
  })
  .refine((d) => !d.startDate || !d.dueDate || d.startDate <= d.dueDate, {
    message: "The due date must be on or after the start date",
  });

function splitAssignee(a: string | null) {
  return {
    assigneeStakeholderId: a?.startsWith("s:") ? a.slice(2) : null,
    teamId: a?.startsWith("t:") ? a.slice(2) : null,
  };
}

export async function saveTask(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const raw = Object.fromEntries(form);
  const parsed = taskSchema.safeParse({ ...raw, metricId: raw.metricId || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { assignee, ...d } = parsed.data;
  const taskId = form.get("taskId") ? String(form.get("taskId")) : null;
  const values = { ...d, ...splitAssignee(assignee) };
  try {
    await asUser(user.id, async (tx) => {
      if (taskId) {
        const { programmeId: _p, ...set } = values;
        const rows = await tx.update(tasks).set(set).where(eq(tasks.id, taskId)).returning({ id: tasks.id });
        if (!rows.length) throw Object.assign(new Error("denied"), { code: "42501" });
      } else {
        const [p] = await tx.select({ ws: programmes.workspaceId }).from(programmes).where(eq(programmes.id, d.programmeId));
        if (!p) throw Object.assign(new Error("denied"), { code: "42501" });
        await tx.insert(tasks).values({ ...values, workspaceId: p.ws, createdBy: user.id });
      }
      await recomputeMetricStatuses(tx, d.programmeId);
    });
  } catch (e) {
    return dbError(e);
  }
  revalidatePath(`/p/${d.programmeId}`, "layout");
  return { ok: Date.now(), message: taskId ? "Task updated." : "Task created." };
}

const statusSchema = z.object({
  programmeId: z.string().uuid(),
  taskId: z.string().uuid(),
  status: z.enum(TASK_STATUSES),
});

/** Assignees and managers can move a task between statuses. */
export async function setTaskStatus(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = statusSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Choose a status" };
  const d = parsed.data;
  try {
    const rows = await asUser(user.id, async (tx) => {
      const r = await tx.update(tasks).set({ status: d.status }).where(eq(tasks.id, d.taskId)).returning({ id: tasks.id });
      await recomputeMetricStatuses(tx, d.programmeId);
      return r;
    });
    if (!rows.length) return { error: "Only the assignee or a programme lead can update this task." };
  } catch (e) {
    return dbError(e);
  }
  revalidatePath(`/p/${d.programmeId}`, "layout");
  return { ok: Date.now() };
}

export async function deleteTask(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const programmeId = String(form.get("programmeId"));
  try {
    const rows = await asUser(user.id, async (tx) => {
      const r = await tx.delete(tasks).where(eq(tasks.id, String(form.get("taskId")))).returning({ id: tasks.id });
      await recomputeMetricStatuses(tx, programmeId);
      return r;
    });
    if (!rows.length) return { error: "You do not have permission to do that." };
  } catch (e) {
    return dbError(e);
  }
  revalidatePath(`/p/${programmeId}`, "layout");
  return { ok: Date.now(), message: "Task deleted." };
}

const commentSchema = z.object({
  programmeId: z.string().uuid(),
  taskId: z.string().uuid(),
  body: z.string().trim().min(1, "Write an update first").max(5000),
});

export async function addComment(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = commentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  try {
    await asUser(user.id, async (tx) => {
      const [t] = await tx.select({ ws: tasks.workspaceId }).from(tasks).where(eq(tasks.id, d.taskId));
      if (!t) throw Object.assign(new Error("denied"), { code: "42501" });
      await tx.insert(taskComments).values({ workspaceId: t.ws, taskId: d.taskId, authorId: user.id, body: d.body });
    });
  } catch (e) {
    return dbError(e);
  }
  revalidatePath(`/p/${d.programmeId}/log`);
  return { ok: Date.now() };
}
