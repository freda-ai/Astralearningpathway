import "server-only";
import { eq } from "drizzle-orm";
import type { Tx } from "@/db";
import { metrics, tasks } from "@/db/schema";
import { todayISO } from "@/lib/domain/dates";
import { deriveMetricStatus } from "@/lib/domain/metrics";

/**
 * Stores each metric's derived status. Status is always recomputed on read
 * for display; the stored copy serves reports, exports and digests. Members
 * cannot update metrics under RLS, so for them this is a quiet no-op and the
 * nightly job catches up.
 */
export async function recomputeMetricStatuses(tx: Tx, programmeId: string) {
  const today = todayISO();
  const [ms, ts] = await Promise.all([
    tx.select().from(metrics).where(eq(metrics.programmeId, programmeId)),
    tx.select({ metricId: tasks.metricId, status: tasks.status, dueDate: tasks.dueDate }).from(tasks).where(eq(tasks.programmeId, programmeId)),
  ]);
  for (const m of ms) {
    const status = deriveMetricStatus(m, ts.filter((t) => t.metricId === m.id), today);
    if (status !== m.status) await tx.update(metrics).set({ status }).where(eq(metrics.id, m.id));
  }
}
