// Simple ClimbSphere mark: a peak inside a sphere, in the brand blue→green.
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="cs-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#287fbc" />
          <stop offset="1" stopColor="#4ea82b" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#cs-mark)" />
      <path d="M7 22 L13.5 12.5 L17 17.5 L19.5 14 L25 22 Z" fill="#fff" fillOpacity="0.95" />
    </svg>
  );
}

export function BrandWordmark({ subtitle }: { subtitle?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>ClimbSphere</span>
        {subtitle && <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{subtitle}</span>}
      </span>
    </span>
  );
}
