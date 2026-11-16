export function ProgressBar({ pct, colour, label }: { pct: number; colour: string; label?: string }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-ink/8"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: colour }} />
    </div>
  );
}

export function ProgressRing({ pct, colour, size = 64 }: { pct: number; colour: string; size?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`${pct}% achieved`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgb(26 26 26 / 0.08)" strokeWidth="7" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={colour}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="36.5" textAnchor="middle" className="fill-ink font-display text-[14px] font-semibold">
        {pct}%
      </text>
    </svg>
  );
}
