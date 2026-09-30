import { Category } from "@/lib/constructs";
import { KillStatus } from "@/lib/analytics";

export const CATEGORY_COLOR: Record<Category, string> = {
  cognition: "var(--series-cognition)",
  skill: "var(--series-skill)",
  decoy: "var(--series-decoy)",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  cognition: "Cognition",
  skill: "Skill",
  decoy: "Decoy",
};

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: KillStatus }) {
  const map: Record<KillStatus, { label: string; color: string }> = {
    pass: { label: "Pass", color: "var(--status-good)" },
    fail: { label: "Fail", color: "var(--status-critical)" },
    insufficient_data: { label: "Insufficient data", color: "var(--text-muted)" },
  };
  const { label, color } = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color, border: `1px solid ${color}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export interface BarDatum {
  key: string;
  label: string;
  value: number; // can be negative (utility) or 0..1 (share)
  color?: string;
}

// Horizontal bar chart. If any value is negative, bars diverge from a zero
// baseline (for MaxDiff utilities); otherwise bars grow from zero on the left.
export function HBarChart({
  data,
  formatValue = (v) => v.toFixed(2),
  height = 28,
}: {
  data: BarDatum[];
  formatValue?: (v: number) => string;
  height?: number;
}) {
  if (data.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>No data yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 0);
  const min = Math.min(...data.map((d) => d.value), 0);
  const span = max - min || 1;
  const zeroPct = ((0 - min) / span) * 100;

  return (
    <div className="flex flex-col gap-2">
      {data.map((d) => {
        const startPct = d.value >= 0 ? zeroPct : ((d.value - min) / span) * 100;
        const widthPct = (Math.abs(d.value) / span) * 100;
        return (
          <div key={d.key} className="flex items-center gap-3">
            <div className="w-48 shrink-0 truncate text-sm" style={{ color: "var(--text-secondary)" }} title={d.label}>
              {d.label}
            </div>
            <div className="relative flex-1 rounded" style={{ height, background: "var(--gridline)" }}>
              <div
                className="absolute top-0 rounded"
                style={{
                  left: `${startPct}%`,
                  width: `${widthPct}%`,
                  height,
                  background: d.color ?? "var(--series-cognition)",
                }}
              />
              {min < 0 && (
                <div
                  className="absolute top-0 h-full w-px"
                  style={{ left: `${zeroPct}%`, background: "var(--baseline)" }}
                />
              )}
            </div>
            <div className="w-14 shrink-0 text-right text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>
              {formatValue(d.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export function ScatterQuadrant({
  points,
}: {
  points: { key: string; label: string; x: number; y: number; color: string }[];
}) {
  const W = 560;
  const H = 360;
  const pad = 40;
  const xMax = Math.max(...points.map((p) => p.x), 0.1);
  const xMin = Math.min(...points.map((p) => p.x), -0.1);
  const xSpan = xMax - xMin || 1;
  const yMax = Math.max(...points.map((p) => p.y), 0.1);

  const toX = (x: number) => pad + ((x - xMin) / xSpan) * (W - 2 * pad);
  const toY = (y: number) => H - pad - (y / (yMax || 1)) * (H - 2 * pad);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl" role="img" aria-label="Value versus hardest-to-assess share, by item">
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--baseline)" />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--baseline)" />
      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
        Mean utility (value) →
      </text>
      <text x={12} y={H / 2} textAnchor="middle" fontSize="11" fill="var(--text-muted)" transform={`rotate(-90 12 ${H / 2})`}>
        Share saying hardest to assess →
      </text>
      {points.map((p) => (
        <g key={p.key}>
          <circle cx={toX(p.x)} cy={toY(p.y)} r={7} fill={p.color} stroke="var(--surface)" strokeWidth={2} />
          <title>
            {p.label}: utility {p.x.toFixed(2)}, hardest-to-assess {(p.y * 100).toFixed(0)}%
          </title>
        </g>
      ))}
    </svg>
  );
}
