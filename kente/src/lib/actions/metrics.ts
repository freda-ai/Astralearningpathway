"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { asUser } from "@/db";
import { metricUpdates, metrics, programmes, tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { recomputeMetricStatuses } from "./recompute";
import { dbError, emptyToNull, type ActionState } from "./state";

const num = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? null : Number(v.replace(/,/g, ""))) : v),
  z.number({ message: "Enter a number" }).finite().nullable(),
);

const metricSchema = z.object({
  programmeId: z.string().uuid(),
  title: z.string().trim().min(2, "Give the outcome a title").max(200),
  description: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable()),
  target: num,
  baseline: num,
  unit: z.preprocess(emptyToNull, z.string().trim().max(40).nullable()),
  deadline: z.preprocess(emptyToNull, z.string().date().nullable()),
});

export async function saveMetric(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = metricSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const metricId = form.get("metricId") ? String(form.get("metricId")) : null;
  const d = parsed.data;
  let id = metricId;
  try {
    await asUser(user.id, async (tx) => {
      if (metricId) {
        const { programmeId: _p, ...set } = d;
        const rows = await tx.update(metrics).set(set).where(eq(metrics.id, metricId)).returning({ id: metrics.id });
        if (!rows.length) throw Object.assign(new Error("denied"), { code: "42501" });
      } else {
        const [p] = await tx.select({ ws: programmes.workspaceId }).from(programmes).where(eq(programmes.id, d.programmeId));
        if (!p) throw Object.assign(new Error("denied"), { code: "42501" });
        [{ id }] = await tx.insert(metrics).values({ ...d, workspaceId: p.ws }).returning({ id: metrics.id });
      }
      await recomputeMetricStatuses(tx, d.programmeId);
    });
  } catch (e) {
    return dbError(e);
  }
  revalidatePath(`/p/${d.programmeId}`, "layout");
  return { ok: Date.now(), message: metricId ? "Outcome updated." : "Outcome created.", data: { id: id! } };
}

const progressSchema = z.object({
  programmeId: z.string().uuid(),
  metricId: z.string().uuid(),
  value: num.refine((v) => v !== null, "Enter the current value"),
  note: z.preprocess(emptyToNull, z.string().trim().max(500).nullable()),
});

/** Manual progress entry for outcomes measured outside Kente, such as survey results. */
export async function recordProgress(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = progressSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  try {
    await asUser(user.id, async (tx) => {
      const [m] = await tx
        .update(metrics)
        .set({ current: d.value })
        .where(eq(metrics.id, d.metricId))
        .returning({ ws: metrics.workspaceId });
      if (!m) throw Object.assign(new Error("denied"), { code: "42501" });
      await tx.insert(metricUpdates).values({ workspaceId: m.ws, metricId: d.metricId, value: d.value!, note: d.note, authorId: user.id });
      await recomputeMetricStatuses(tx, d.programmeId);
    });
  } catch (e) {
    return dbError(e);
  }
  revalidatePath(`/p/${d.programmeId}`, "layout");
  return { ok: Date.now(), message: "Progress recorded." };
}

export async function deleteMetric(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const metricId = String(form.get("metricId"));
  const programmeId = String(form.get("programmeId"));
  try {
    const linked = await asUser(user.id, (tx) => tx.select({ id: tasks.id }).from(tasks).where(eq(tasks.metricId, metricId)));
    if (linked.length) {
      return { error: `${linked.length} task${linked.length === 1 ? " is" : "s are"} linked to this outcome. Move or delete them first.` };
    }
    await asUser(user.id, (tx) => tx.delete(metrics).where(eq(metrics.id, metricId)));
  } catch (e) {
    return dbError(e);
  }
  revalidatePath(`/p/${programmeId}`, "layout");
  redirect(`/p/${programmeId}/metrics`);
}
