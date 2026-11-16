import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { adminDb, asUser } from "@/db";
import { users } from "@/db/schema";

export async function resetDb() {
  await adminDb().execute(sql`
    truncate table task_comments, tasks, metric_updates, metrics, stakeholders, teams,
      programmes, memberships, local_credentials, users, workspaces restart identity cascade`);
}

export async function makeUser(name: string) {
  const id = randomUUID();
  const email = `${name.toLowerCase()}-${id.slice(0, 6)}@example.org`;
  await adminDb().insert(users).values({ id, email, name });
  return { id, email, name };
}

export async function makeWorkspace(userId: string, name = "Acme") {
  return asUser(userId, async (tx) => {
    const rows = await tx.execute<{ id: string }>(sql`select app.create_workspace(${name}) as id`);
    return rows[0].id;
  });
}
