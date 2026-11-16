import { cn } from "@/lib/utils";
import type { DisplayStatus } from "@/lib/domain/tasks";
import { DISPLAY_STATUS_LABEL } from "@/lib/domain/tasks";
import type { MetricStatus, Priority } from "@/db/schema";
import { METRIC_STATUS_LABEL } from "@/lib/domain/metrics";

type Tone = "green" | "gold" | "red" | "neutral" | "dark";

const tones: Record<Tone, string> = {
  green: "bg-forest-soft text-forest",
  gold: "bg-gold-soft text-gold-dark",
  red: "bg-terracotta-soft text-terracotta",
  neutral: "bg-ink/5 text-muted",
  dark: "bg-ink text-cream",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export const taskTone: Record<DisplayStatus, Tone> = {
  pending: "neutral",
  in_progress: "gold",
  completed: "green",
  overdue: "red",
};

export const metricTone: Record<MetricStatus, Tone> = {
  on_track: "green",
  achieved: "green",
  at_risk: "gold",
  behind: "red",
};

/** Colour for bars and rings, by metric status. */
export const metricColour: Record<MetricStatus, string> = {
  on_track: "var(--color-forest)",
  achieved: "var(--color-forest)",
  at_risk: "var(--color-gold)",
  behind: "var(--color-terracotta)",
};

export function TaskStatusBadge({ status }: { status: DisplayStatus }) {
  return <Badge tone={taskTone[status]}>{DISPLAY_STATUS_LABEL[status]}</Badge>;
}

export function MetricStatusBadge({ status }: { status: MetricStatus }) {
  return <Badge tone={metricTone[status]}>{METRIC_STATUS_LABEL[status]}</Badge>;
}

const priorityTone: Record<Priority, Tone> = { low: "neutral", medium: "neutral", high: "gold", urgent: "red" };

export function PriorityFlag({ priority }: { priority: Priority }) {
  return (
    <Badge tone={priorityTone[priority]} className="capitalize">
      <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
        <path d="M2 11V1.5h7l-1.5 2.5L9 6.5H2" fill="currentColor" />
      </svg>
      {priority}
    </Badge>
  );
}
