// ClimbSphere wordmark (text only — no logo image for now).
export function BrandWordmark({ subtitle }: { subtitle?: string }) {
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-[15px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>ClimbSphere</span>
      {subtitle && <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{subtitle}</span>}
    </span>
  );
}
