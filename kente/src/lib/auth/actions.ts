"use server";

import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminDb } from "@/db";
import { localCredentials, users } from "@/db/schema";
import { assertLocalAuthAllowed, supabaseEnabled } from "./config";
import { createSessionToken, hashPassword, SESSION_COOKIE, SESSION_TTL_SECONDS, verifyPassword } from "./local";
import { ensureUserRow } from "./session";
import { supabaseServer } from "./supabase";

export interface AuthState {
  error?: string;
  message?: string;
}

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

/** Only allow same-site relative redirects. */
function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

async function setLocalSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.APP_URL?.startsWith("http://"),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  if (supabaseEnabled()) {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: `${process.env.APP_URL ?? ""}${safeNext(form.get("next"))}` },
    });
    if (error) return { error: error.message };
    if (!data.session) return { message: "Check your email to confirm your account, then sign in." };
    await ensureUserRow(data.user!.id, email, name);
    await adminDb().update(users).set({ name }).where(eq(users.id, data.user!.id));
  } else {
    assertLocalAuthAllowed();
    const db = adminDb();
    const [existing] = await db.select().from(users).where(sql`lower(${users.email}) = ${email}`);
    if (existing) return { error: "An account with this email already exists. Sign in instead." };
    const id = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(users).values({ id, email, name });
      await tx.insert(localCredentials).values({ userId: id, passwordHash: await hashPassword(password) });
    });
    await setLocalSession(id);
  }
  redirect(safeNext(form.get("next")));
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;
  const invalid = { error: "That email and password do not match." };

  if (supabaseEnabled()) {
    const { error } = await (await supabaseServer()).auth.signInWithPassword({ email, password });
    if (error) return invalid;
  } else {
    assertLocalAuthAllowed();
    const [row] = await adminDb()
      .select({ id: users.id, hash: localCredentials.passwordHash })
      .from(users)
      .innerJoin(localCredentials, eq(localCredentials.userId, users.id))
      .where(sql`lower(${users.email}) = ${email}`);
    if (!row || !(await verifyPassword(password, row.hash))) return invalid;
    await setLocalSession(row.id);
  }
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  if (supabaseEnabled()) {
    await (await supabaseServer()).auth.signOut();
  } else {
    (await cookies()).delete(SESSION_COOKIE);
  }
  redirect("/login");
}
