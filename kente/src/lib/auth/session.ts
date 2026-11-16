import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminDb } from "@/db";
import { users } from "@/db/schema";
import { assertLocalAuthAllowed, supabaseEnabled } from "./config";
import { readSessionToken, SESSION_COOKIE } from "./local";
import { supabaseServer } from "./supabase";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

/** The signed-in user for this request, or null. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  let id: string | null = null;
  if (supabaseEnabled()) {
    const { data } = await (await supabaseServer()).auth.getUser();
    if (data.user) {
      id = data.user.id;
      await ensureUserRow(id, data.user.email ?? "", (data.user.user_metadata?.name as string | undefined) ?? null);
    }
  } else {
    assertLocalAuthAllowed();
    id = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  }
  if (!id) return null;
  const [row] = await adminDb().select().from(users).where(eq(users.id, id));
  return row ? { id: row.id, email: row.email, name: row.name } : null;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Keeps public.users in step with the auth provider's user. */
export async function ensureUserRow(id: string, email: string, name: string | null) {
  await adminDb()
    .insert(users)
    .values({ id, email, name })
    .onConflictDoUpdate({ target: users.id, set: { email } });
}

export function displayName(u: { name: string | null; email: string }) {
  return u.name?.trim() || u.email.split("@")[0];
}
