/**
 * Demo data for local development. Creates a demo owner, a workspace and one
 * realistic programme. Runs as the database owner (bypassing RLS), which is
 * fine for an admin script; the app itself never does this.
 *
 *   npm run db:seed
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as s from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";
import { addDays, todayISO } from "../src/lib/domain/dates";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed a production database");

const client = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(client, { schema: s });

const EMAIL = "demo@kente.local";
const PASSWORD = "kente-demo-2026";
const today = todayISO();
const d = (n: number) => addDays(today, n);

const existing = await db.execute(sql`select id from users where lower(email) = ${EMAIL}`);
if (existing.length) {
  console.log(`Demo data already exists. Sign in as ${EMAIL} / ${PASSWORD}`);
  await client.end();
  process.exit(0);
}

await db.transaction(async (tx) => {
  const ownerId = randomUUID();
  await tx.insert(s.users).values({ id: ownerId, email: EMAIL, name: "Freda Anyanwu" });
  await tx.insert(s.localCredentials).values({ userId: ownerId, passwordHash: await hashPassword(PASSWORD) });

  const [ws] = await tx.insert(s.workspaces).values({ name: "EBH Africa" }).returning();
  await tx.insert(s.memberships).values({ workspaceId: ws.id, userId: ownerId, role: "owner" });

  const [p] = await tx
    .insert(s.programmes)
    .values({
      workspaceId: ws.id,
      name: "Young Founders Accelerator 2027",
      description: "A nine-month accelerator for early-stage founders in Lagos, Abuja and Accra.",
      startDate: d(-75),
      endDate: d(225),
      createdBy: ownerId,
    })
    .returning();
  const base = { workspaceId: ws.id, programmeId: p.id };

  const [field, content] = await tx
    .insert(s.teams)
    .values([
      { ...base, name: "Field Team" },
      { ...base, name: "Curriculum" },
    ])
    .returning();

  const people = await tx
    .insert(s.stakeholders)
    .values([
      { ...base, userId: ownerId, email: EMAIL, name: "Freda Anyanwu", roleTitle: "Programme Lead", accessRole: "lead", joinedAt: new Date() },
      { ...base, email: "kemi@example.org", name: "Kemi Adebayo", roleTitle: "Programme Officer", teamId: field.id, inviteToken: randomUUID(), invitedAt: new Date() },
      { ...base, email: "kwame@example.org", name: "Kwame Mensah", roleTitle: "Facilitator", teamId: content.id, inviteToken: randomUUID(), invitedAt: new Date() },
      { ...base, email: "amina@example.org", name: "Amina Bello", roleTitle: "Coordinator", teamId: field.id, inviteToken: randomUUID(), invitedAt: new Date() },
      { ...base, email: "grants@example.org", name: "Partner Foundation", roleTitle: "Funder", accessRole: "viewer", inviteToken: randomUUID(), invitedAt: new Date() },
    ])
    .returning();
  const [freda, kemi, kwame, amina] = people;

  const created = new Date(`${d(-75)}T09:00:00Z`);
  const [train, mentor, fund] = await tx
    .insert(s.metrics)
    .values([
      { ...base, title: "Train 500 young founders by June 2027", target: 500, baseline: 0, current: 120, unit: "founders", deadline: d(210), createdAt: created },
      { ...base, title: "Match 80% of founders with a mentor", target: 80, baseline: 0, unit: "%", deadline: d(120), createdAt: created },
      { ...base, title: "Help 50 startups raise first funding", target: 50, baseline: 0, unit: "startups", deadline: d(225), createdAt: created },
    ])
    .returning();

  await tx.insert(s.metricUpdates).values([
    { workspaceId: ws.id, metricId: train.id, value: 45, note: "Cohort 1 intake", authorId: ownerId, createdAt: new Date(`${d(-50)}T10:00:00Z`) },
    { workspaceId: ws.id, metricId: train.id, value: 120, note: "Cohort 1 graduation", authorId: ownerId, createdAt: new Date(`${d(-8)}T10:00:00Z`) },
  ]);

  type T = typeof s.tasks.$inferInsert;
  const t = (x: Omit<T, "workspaceId" | "programmeId">): T => ({
    ...base,
    createdBy: ownerId,
    createdAt: new Date(`${x.startDate && x.startDate < today ? addDays(x.startDate, -7) : d(-7)}T09:00:00Z`),
    ...x,
  });
  const rows: T[] = [
    t({ metricId: train.id, title: "Recruit cohort 1 founders", assigneeStakeholderId: kemi.id, startDate: d(-70), dueDate: d(-45), status: "completed", priority: "high", completedAt: new Date(`${d(-46)}T12:00:00Z`) }),
    t({ metricId: train.id, title: "Run cohort 1 bootcamp", teamId: content.id, startDate: d(-40), dueDate: d(-10), status: "completed", completedAt: new Date(`${d(-9)}T12:00:00Z`) }),
    t({ metricId: train.id, title: "Open applications for cohort 2", assigneeStakeholderId: amina.id, startDate: d(-5), dueDate: d(-1), status: "in_progress", priority: "urgent" }),
    t({ metricId: train.id, title: "Book venues in Abuja and Accra", assigneeStakeholderId: amina.id, startDate: d(-14), dueDate: d(-4), status: "pending", priority: "high" }),
    t({ metricId: train.id, title: "Update curriculum with cohort 1 feedback", assigneeStakeholderId: kwame.id, startDate: d(-3), dueDate: d(6), status: "in_progress" }),
    t({ metricId: mentor.id, title: "Recruit 40 mentors", assigneeStakeholderId: freda.id, startDate: d(-30), dueDate: d(14), status: "in_progress", priority: "high" }),
    t({ metricId: mentor.id, title: "Mentor matching session", teamId: field.id, startDate: d(15), dueDate: d(21), status: "pending" }),
    t({ metricId: mentor.id, title: "Mentor onboarding pack", assigneeStakeholderId: kwame.id, startDate: d(-20), dueDate: d(-2), status: "pending" }),
    t({ metricId: fund.id, title: "Investor readiness workshop", assigneeStakeholderId: kemi.id, startDate: d(20), dueDate: d(35), status: "pending" }),
    t({ metricId: fund.id, title: "Build investor shortlist", startDate: d(5), dueDate: d(40), status: "pending", priority: "low" }),
    t({ metricId: fund.id, title: "Demo day planning", assigneeStakeholderId: freda.id, startDate: d(60), dueDate: d(150), status: "pending" }),
  ];
  const inserted = await tx.insert(s.tasks).values(rows).returning();
  await tx.insert(s.taskComments).values([
    { workspaceId: ws.id, taskId: inserted[2].id, authorId: ownerId, body: "Application form is live. 210 applications so far." },
    { workspaceId: ws.id, taskId: inserted[3].id, authorId: ownerId, body: "Abuja venue confirmed; Accra still waiting on a quote." },
  ]);
});

console.log(`Demo data created. Sign in as ${EMAIL} / ${PASSWORD}`);
await client.end();
