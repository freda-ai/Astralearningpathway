import type { SeriesPoint } from "@/lib/domain/metrics";
import { formatDate } from "@/lib/domain/dates";

/** Step chart of progress over time. Pure SVG, no chart library. */
export function ProgressChart({ series, colour }: { series: SeriesPoint[]; colour: string }) {
  const W = 640;
  const H = 200;
  const pad = { l: 36, r: 12, t: 12, b: 28 };
  const t0 = Date.parse(series[0].date);
  const t1 = Math.max(Date.parse(series[series.length - 1].date), t0 + 86_400_000);
  const x = (d: string) => pad.l + ((Date.parse(d) - t0) / (t1 - t0)) * (W - pad.l - pad.r);
  const y = (p: number) => pad.t + (1 - p / 100) * (H - pad.t - pad.b);

  let path = `M ${x(series[0].date)} ${y(series[0].pct)}`;
  for (const p of series.slice(1)) path += ` H ${x(p.date)} V ${y(p.pct)}`;
  const area = `${path} V ${y(0)} H ${x(series[0].date)} Z`;
  const last = series[series.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Progress over time, now ${last.pct}%`}>
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="var(--color-line)" strokeDasharray={g ? "3 4" : undefined} />
          <text x={pad.l - 8} y={y(g) + 4} textAnchor="end" className="fill-muted text-[10px]">
            {g}%
          </text>
        </g>
      ))}
      <path d={area} fill={colour} opacity={0.12} />
      <path d={path} fill="none" stroke={colour} strokeWidth={2.5} strokeLinejoin="round" />
      {series.map((p) => (
        <circle key={p.date} cx={x(p.date)} cy={y(p.pct)} r={3} fill={colour} />
      ))}
      <text x={pad.l} y={H - 8} className="fill-muted text-[10px]">
        {formatDate(series[0].date)}
      </text>
      <text x={W - pad.r} y={H - 8} textAnchor="end" className="fill-muted text-[10px]">
        {formatDate(last.date)}
      </text>
    </svg>
  );
}
