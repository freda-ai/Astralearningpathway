import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#1A1A1A" />
      <rect x="7" y="7" width="8" height="8" fill="#E8A317" />
      <rect x="17" y="7" width="8" height="8" fill="#1F5E3B" />
      <rect x="7" y="17" width="8" height="8" fill="#C1440E" />
      <rect x="17" y="17" width="8" height="8" fill="#E8A317" />
    </svg>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark />
      <span className={cn("font-display text-xl font-semibold", dark ? "text-cream" : "text-ink")}>Kente</span>
    </span>
  );
}
