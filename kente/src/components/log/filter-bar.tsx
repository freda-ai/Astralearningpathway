"use client";

import { CalendarRange, KanbanSquare, List } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LogOptions } from "./types";

const VIEWS = [
  { id: "list", label: "List", icon: List },
  { id: "board", label: "Board", icon: KanbanSquare },
  { id: "timeline", label: "Timeline", icon: CalendarRange },
] as const;

const selectCls = "h-9 rounded-md border border-line bg-paper px-2 text-sm focus:border-gold focus:outline-none";

export function FilterBar({ options, view }: { options: LogOptions; view: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const hrefWith = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    next.delete("task");
    if (value) next.set(key, value);
    else next.delete(key);
    return `${pathname}${next.size ? `?${next}` : ""}`;
  };
  const set = (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) => router.replace(hrefWith(key, e.target.value || null));
  const filtered = ["metric", "who", "status", "q"].some((k) => params.get(k));

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <div role="tablist" aria-label="View" className="inline-flex rounded-lg border border-line bg-paper p-1 text-sm">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            role="tab"
            aria-selected={view === id}
            href={hrefWith("view", id === "list" ? null : id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5",
              view === id ? "bg-ink text-cream" : "text-muted hover:text-ink",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </div>

      <select aria-label="Filter by metric" className={selectCls} value={params.get("metric") ?? ""} onChange={set("metric")}>
        <option value="">All metrics</option>
        {options.metrics.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <select aria-label="Filter by assignee" className={selectCls} value={params.get("who") ?? ""} onChange={set("who")}>
        <option value="">Everyone</option>
        <optgroup label="People">
          {options.people.map((p) => (
            <option key={p.id} value={`s:${p.id}`}>
              {p.name}
            </option>
          ))}
        </optgroup>
        {options.teams.length > 0 && (
          <optgroup label="Teams">
            {options.teams.map((t) => (
              <option key={t.id} value={`t:${t.id}`}>
                {t.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <select aria-label="Filter by status" className={selectCls} value={params.get("status") ?? ""} onChange={set("status")}>
        <option value="">Any status</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
        <option value="overdue">Overdue</option>
      </select>
      {params.get("q") && (
        <span className="rounded-full bg-gold-soft px-3 py-1 text-xs text-gold-dark">Search: “{params.get("q")}”</span>
      )}
      {filtered && (
        <Link href={`${pathname}${view !== "list" ? `?view=${view}` : ""}`} className="text-sm text-muted underline underline-offset-4">
          Clear filters
        </Link>
      )}
    </div>
  );
}
