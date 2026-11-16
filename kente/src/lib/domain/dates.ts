/** ISO date (YYYY-MM-DD) for "today" in the app's time zone. */
export function todayISO(timeZone = process.env.APP_TIMEZONE || "Africa/Lagos", now = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000);
}

export type Period = "today" | "week" | "month";

/** Inclusive [start, end] ISO date range for a dashboard period. Weeks start on Monday. */
export function periodRange(period: Period, today: string): { start: string; end: string } {
  if (period === "today") return { start: today, end: today };
  if (period === "week") {
    const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
    const start = addDays(today, -dow);
    return { start, end: addDays(start, 6) };
  }
  const start = `${today.slice(0, 8)}01`;
  const next = new Date(`${start}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { start, end: addDays(next.toISOString().slice(0, 10), -1) };
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
