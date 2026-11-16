import "server-only";
import { asc, eq } from "drizzle-orm";
import { cache } from "react";
import { asUser } from "@/db";
import { metrics, stakeholders, tasks, teams } from "@/db/schema";

export type StakeholderRow = typeof stakeholders.$inferSelect;
export type TeamRow = typeof teams.$inferSelect;
export type MetricRow = typeof metrics.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;

/** Everything a programme page needs, loaded once per request under RLS. */
export const loadProgrammeData = cache(async (userId: string, programmeId: string) =>
  asUser(userId, async (tx) => {
    const [s, t, m, k] = await Promise.all([
      tx.select().from(stakeholders).where(eq(stakeholders.programmeId, programmeId)).orderBy(asc(stakeholders.createdAt)),
      tx.select().from(teams).where(eq(teams.programmeId, programmeId)).orderBy(asc(teams.name)),
      tx.select().from(metrics).where(eq(metrics.programmeId, programmeId)).orderBy(asc(metrics.createdAt)),
      tx.select().from(tasks).where(eq(tasks.programmeId, programmeId)).orderBy(asc(tasks.dueDate), asc(tasks.createdAt)),
    ]);
    return { stakeholders: s, teams: t, metrics: m, tasks: k };
  }),
);

export function stakeholderName(s: Pick<StakeholderRow, "name" | "email">): string {
  return s.name?.trim() || s.email;
}
