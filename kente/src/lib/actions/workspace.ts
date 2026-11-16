"use server";

import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { asUser } from "@/db";
import { programmes, stakeholders } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { getWorkspaces, WORKSPACE_COOKIE } from "@/lib/data/context";
import { dbError, emptyToNull, type ActionState } from "./state";

const workspaceSchema = z.object({ name: z.string().trim().min(2, "Give your workspace a name").max(120) });

export async function createWorkspace(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = workspaceSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  let id: string;
  try {
    const rows = await asUser(user.id, (tx) =>
      tx.execute<{ id: string }>(sql`select app.create_workspace(${parsed.data.name}) as id`),
    );
    id = rows[0].id;
  } catch (e) {
    return dbError(e);
  }
  (await cookies()).set(WORKSPACE_COOKIE, id, { path: "/", sameSite: "lax", httpOnly: true });
  redirect("/programmes");
}

export async function switchWorkspace(form: FormData) {
  const user = await requireUser();
  const id = String(form.get("workspaceId") ?? "");
  if ((await getWorkspaces(user.id)).some((w) => w.id === id)) {
    (await cookies()).set(WORKSPACE_COOKIE, id, { path: "/", sameSite: "lax", httpOnly: true });
  }
  redirect("/programmes");
}

const programmeSchema = z
  .object({
    workspaceId: z.string().uuid(),
    name: z.string().trim().min(2, "Give the programme a name").max(160),
    description: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable()),
    startDate: z.preprocess(emptyToNull, z.string().date().nullable()),
    endDate: z.preprocess(emptyToNull, z.string().date().nullable()),
  })
  .refine((d) => !d.startDate || !d.endDate || d.startDate <= d.endDate, {
    message: "The end date must be on or after the start date",
  });

export async function createProgramme(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = programmeSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  let id: string;
  try {
    id = await asUser(user.id, async (tx) => {
      const [p] = await tx
        .insert(programmes)
        .values({ ...d, createdBy: user.id })
        .returning({ id: programmes.id });
      // The creator joins the programme as its lead so work can be assigned to them.
      await tx.insert(stakeholders).values({
        workspaceId: d.workspaceId,
        programmeId: p.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        roleTitle: "Programme Lead",
        accessRole: "lead",
        joinedAt: new Date(),
      });
      return p.id;
    });
  } catch (e) {
    return dbError(e);
  }
  redirect(`/p/${id}/dashboard`);
}
