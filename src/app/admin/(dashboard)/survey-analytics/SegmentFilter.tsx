"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ROLE_OPTIONS, AI_MATURITY_OPTIONS } from "@/lib/surveyOptions";

export default function SegmentFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  const selectStyle = {
    background: "var(--surface)",
    borderColor: "var(--gridline)",
    color: "var(--text-primary)",
  } as const;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span style={{ color: "var(--text-muted)" }}>Cross-tabulate by:</span>
      <select
        className="rounded-md border px-2 py-1"
        style={selectStyle}
        value={params.get("role") ?? ""}
        onChange={(e) => update("role", e.target.value)}
      >
        <option value="">Role — all</option>
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        className="rounded-md border px-2 py-1"
        style={selectStyle}
        value={params.get("maturity") ?? ""}
        onChange={(e) => update("maturity", e.target.value)}
      >
        <option value="">AI maturity (1.6) — all</option>
        {AI_MATURITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {(params.get("role") || params.get("maturity")) && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs underline"
          style={{ color: "var(--text-muted)" }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
