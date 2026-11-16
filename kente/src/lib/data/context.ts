import "server-only";
import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { asUser } from "@/db";
import { memberships, programmes, workspaces, type Role } from "@/db/schema";
import { requireUser, type SessionUser } from "@/lib/auth/session";

export const WORKSPACE_COOKIE = "kente_ws";

export interface WorkspaceMembership {
  id: string;
  name: string;
  plan: string;
  role: Role;
}

export const getWorkspaces = cache(async (userId: string): Promise<WorkspaceMembership[]> =>
  asUser(userId, (tx) =>
    tx
      .select({ id: workspaces.id, name: workspaces.name, plan: workspaces.plan, role: memberships.role })
      .from(memberships)
      .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
      .where(eq(memberships.userId, userId))
      .orderBy(asc(workspaces.createdAt)),
  ),
);

/** The signed-in user and their current workspace. Sends them to onboarding if they have none. */
export const requireWorkspace = cache(async (): Promise<{ user: SessionUser; workspace: WorkspaceMembership; all: WorkspaceMembership[] }> => {
  const user = await requireUser();
  const all = await getWorkspaces(user.id);
  if (all.length === 0) redirect("/onboarding");
  const chosen = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  const workspace = all.find((w) => w.id === chosen) ?? all[0];
  return { user, workspace, all };
});

export const listProgrammes = cache(async (userId: string, workspaceId: string) =>
  asUser(userId, (tx) =>
    tx.select().from(programmes).where(eq(programmes.workspaceId, workspaceId)).orderBy(asc(programmes.name)),
  ),
);

export interface ProgrammeContext {
  user: SessionUser;
  programme: typeof programmes.$inferSelect;
  role: Role;
  canManage: boolean;
}

/** Loads a programme the user can see (row-level security decides) or 404s. */
export const requireProgramme = cache(async (programmeId: string): Promise<ProgrammeContext> => {
  const user = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(programmeId)) notFound();
  const [programme] = await asUser(user.id, (tx) => tx.select().from(programmes).where(eq(programmes.id, programmeId)));
  if (!programme) notFound();
  const ws = (await getWorkspaces(user.id)).find((w) => w.id === programme.workspaceId);
  if (!ws) notFound();
  return { user, programme, role: ws.role, canManage: ws.role === "owner" || ws.role === "lead" };
});
