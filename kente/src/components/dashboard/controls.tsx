"use client";

import { RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PERIOD_COOKIE, type Period } from "@/lib/domain/dates";
import { cn } from "@/lib/utils";


const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

const selectCls = "h-9 rounded-md border border-line bg-paper px-2 text-sm focus:border-gold focus:outline-none";

export function DashboardControls({
  period,
  teams,
  people,
}: {
  period: Period;
  teams: { id: string; name: string }[];
  people: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const go = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`);
  };

  const choosePeriod = (p: Period) => {
    // Remembered as the user's preference.
    document.cookie = `${PERIOD_COOKIE}=${p}; path=/; max-age=31536000; samesite=lax`;
    go("period", p);
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <div role="tablist" aria-label="Period" className="inline-flex rounded-lg border border-line bg-paper p-1 text-sm">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            role="tab"
            type="button"
            aria-selected={period === p.id}
            onClick={() => choosePeriod(p.id)}
            className={cn("rounded-md px-3 py-1.5", period === p.id ? "bg-ink text-cream" : "text-muted hover:text-ink")}
          >
            {p.label}
          </button>
        ))}
      </div>
      {teams.length > 0 && (
        <select aria-label="Filter by team" className={selectCls} value={params.get("team") ?? ""} onChange={(e) => go("team", e.target.value || null)}>
          <option value="">All teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
      <select
        aria-label="Filter by stakeholder"
        className={selectCls}
        value={params.get("person") ?? ""}
        onChange={(e) => go("person", e.target.value || null)}
      >
        <option value="">All stakeholders</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function RegenerateButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => start(() => router.refresh())}>
      <RefreshCw className={cn(pending && "animate-spin")} />
      {pending ? "Regenerating…" : "Regenerate"}
    </Button>
  );
}
