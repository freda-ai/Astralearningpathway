"use server";

import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { asUser } from "@/db";
import { memberships, programmes, stakeholders, teams, users, workspaces } from "@/db/schema";
import { displayName, requireUser } from "@/lib/auth/session";
import { WORKSPACE_COOKIE } from "@/lib/data/context";
import { appUrl, escapeHtml, sendEmail } from "@/lib/email";
import { dbError, emptyToNull, type ActionState } from "./state";

const newToken = () => randomBytes(24).toString("base64url");

const inviteSchema = z.object({
  programmeId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  name: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  roleTitle: z.preprocess(emptyToNull, z.string().trim().max(80).nullable()),
  accessRole: z.enum(["lead", "member", "reviewer", "viewer"]),
  teamId: z.preprocess(emptyToNull, z.string().uuid().nullable()),
});

async function sendInvite(opts: { to: string; token: string; programme: string; workspace: string; inviter: string; roleTitle: string | null }) {
  const link = appUrl(`/invite/${opts.token}`);
  const role = opts.roleTitle ? ` as ${opts.roleTitle}` : "";
  const text = `${opts.inviter} has invited you to join ${opts.programme} (${opts.workspace}) on Kente${role}.\n\nAccept the invite: ${link}\n`;
  const html = `<p>${escapeHtml(opts.inviter)} has invited you to join <strong>${escapeHtml(opts.programme)}</strong> (${escapeHtml(opts.workspace)}) on Kente${escapeHtml(role)}.</p><p><a href="${link}">Accept the invite</a></p>`;
  const { delivered } = await sendEmail({ to: opts.to, subject: `You're invited to ${opts.programme} on Kente`, text, html });
  return { link, delivered };
}

export async function inviteStakeholder(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = inviteSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  try {
    const result = await asUser(user.id, async (tx) => {
      const [p] = await tx
        .select({ id: programmes.id, name: programmes.name, workspaceId: programmes.workspaceId, workspace: workspaces.name })
        .from(programmes)
        .innerJoin(workspaces, eq(workspaces.id, programmes.workspaceId))
        .where(eq(programmes.id, d.programmeId));
      if (!p) throw Object.assign(new Error("not found"), { code: "42501" });

      // Someone already in the workspace joins the programme straight away.
      const [existing] = await tx
        .select({ id: users.id, name: users.name })
        .from(users)
        .innerJoin(memberships, and(eq(memberships.userId, users.id), eq(memberships.workspaceId, p.workspaceId)))
        .where(sql`lower(${users.email}) = ${d.email}`);

      const token = existing ? null : newToken();
      await tx.insert(stakeholders).values({
        workspaceId: p.workspaceId,
        programmeId: p.id,
        email: d.email,
        name: d.name ?? existing?.name ?? null,
        roleTitle: d.roleTitle,
        accessRole: d.accessRole,
        teamId: d.teamId,
        userId: existing?.id ?? null,
        joinedAt: existing ? new Date() : null,
        inviteToken: token,
        invitedAt: new Date(),
      });
      return { p, token, existing };
    });

    revalidatePath(`/p/${d.programmeId}`, "layout");
    if (!result.token) {
      return { ok: Date.now(), message: `${d.email} is already in this workspace and has been added to the programme.` };
    }
    const { link, delivered } = await sendInvite({
      to: d.email,
      token: result.token,
      programme: result.p.name,
      workspace: result.p.workspace,
      inviter: displayName(user),
      roleTitle: d.roleTitle,
    });
    return {
      ok: Date.now(),
      message: delivered ? `Invite sent to ${d.email}.` : `Invite created for ${d.email}. Email is not configured, so share this link:`,
      data: { link },
    };
  } catch (e) {
    const err = e as { cause?: { code?: string } };
    if (err.cause?.code === "23505") return { error: `${d.email} is already on this programme.` };
    return dbError(e);
  }
}

export async function resendInvite(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = z.string().uuid().safeParse(form.get("stakeholderId"));
  if (!id.success) return { error: "Unknown stakeholder" };
  try {
    const row = await asUser(user.id, async (tx) => {
      const token = newToken();
      const [s] = await tx
        .update(stakeholders)
        .set({ inviteToken: token, invitedAt: new Date() })
        .where(and(eq(stakeholders.id, id.data), sql`${stakeholders.userId} is null`))
        .returning();
      if (!s) return null;
      const [p] = await tx
        .select({ name: programmes.name, workspace: workspaces.name })
        .from(programmes)
        .innerJoin(workspaces, eq(workspaces.id, programmes.workspaceId))
        .where(eq(programmes.id, s.programmeId));
      return { s, p, token };
    });
    if (!row) return { error: "That invite has already been accepted, or you cannot manage it." };
    const { link, delivered } = await sendInvite({
      to: row.s.email,
      token: row.token,
      programme: row.p.name,
      workspace: row.p.workspace,
      inviter: displayName(user),
      roleTitle: row.s.roleTitle,
    });
    return { ok: Date.now(), message: delivered ? "Invite sent again." : "New invite link:", data: { link } };
  } catch (e) {
    return dbError(e);
  }
}

const updateSchema = z.object({
  stakeholderId: z.string().uuid(),
  programmeId: z.string().uuid(),
  name: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  roleTitle: z.preprocess(emptyToNull, z.string().trim().max(80).nullable()),
  teamId: z.preprocess(emptyToNull, z.string().uuid().nullable()),
});

export async function updateStakeholder(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = updateSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { stakeholderId, programmeId, ...set } = parsed.data;
  try {
    const rows = await asUser(user.id, (tx) =>
      tx.update(stakeholders).set(set).where(eq(stakeholders.id, stakeholderId)).returning({ id: stakeholders.id }),
    );
    if (!rows.length) return { error: "You do not have permission to do that." };
  } catch (e) {
    return dbError(e);
  }
  revalidatePath(`/p/${programmeId}`, "layout");
  return { ok: Date.now(), message: "Saved." };
}

export async function removeStakeholder(form: FormData) {
  const user = await requireUser();
  const id = String(form.get("stakeholderId"));
  const programmeId = String(form.get("programmeId"));
  await asUser(user.id, (tx) => tx.delete(stakeholders).where(eq(stakeholders.id, id)));
  revalidatePath(`/p/${programmeId}`, "layout");
  redirect(`/p/${programmeId}/stakeholders`);
}

const teamSchema = z.object({
  programmeId: z.string().uuid(),
  name: z.string().trim().min(1, "Name the team").max(80),
});

export async function createTeam(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = teamSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await asUser(user.id, async (tx) => {
      const [p] = await tx.select({ ws: programmes.workspaceId }).from(programmes).where(eq(programmes.id, parsed.data.programmeId));
      if (!p) throw Object.assign(new Error("not found"), { code: "42501" });
      await tx.insert(teams).values({ workspaceId: p.ws, ...parsed.data });
    });
  } catch (e) {
    const err = e as { cause?: { code?: string } };
    if (err.cause?.code === "23505") return { error: "A team with that name already exists." };
    return dbError(e);
  }
  revalidatePath(`/p/${parsed.data.programmeId}`, "layout");
  return { ok: Date.now(), message: "Team created." };
}

export async function deleteTeam(form: FormData) {
  const user = await requireUser();
  const programmeId = String(form.get("programmeId"));
  await asUser(user.id, (tx) => tx.delete(teams).where(eq(teams.id, String(form.get("teamId")))));
  revalidatePath(`/p/${programmeId}`, "layout");
}

export async function acceptInvite(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const token = String(form.get("token") ?? "");
  let programmeId: string;
  try {
    const rows = await asUser(user.id, (tx) =>
      tx.execute<{ pid: string; ws: string }>(
        sql`select pid, (select workspace_id from programmes where id = pid) as ws from app.accept_invite(${token}) as pid`,
      ),
    );
    programmeId = rows[0].pid;
    (await cookies()).set(WORKSPACE_COOKIE, rows[0].ws, { path: "/", sameSite: "lax", httpOnly: true });
  } catch (e) {
    return dbError(e, "We could not accept this invite.");
  }
  redirect(`/p/${programmeId}/dashboard`);
}
