"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PERSONAS } from "@/lib/constructs";

export default function NewInterviewPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [arm, setArm] = useState("A");
  const [persona, setPersona] = useState("M1");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputStyle = { background: "var(--surface)", borderColor: "var(--gridline)", color: "var(--text-primary)" } as const;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, arm, persona, date }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Failed to create interview");
      return;
    }
    router.push(`/admin/interviews/${body.id}`);
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>New interview</h1>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>Code (e.g. R01)</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} required className="rounded-md border px-3 py-2" style={inputStyle} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>Arm</span>
          <select value={arm} onChange={(e) => setArm(e.target.value)} className="rounded-md border px-3 py-2" style={inputStyle}>
            <option value="A">A — no definitions</option>
            <option value="B">B — sees definitions</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>Persona</span>
          <select value={persona} onChange={(e) => setPersona(e.target.value)} className="rounded-md border px-3 py-2" style={inputStyle}>
            {Object.entries(PERSONAS).map(([k, v]) => (
              <option key={k} value={k}>{k} — {v}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md border px-3 py-2" style={inputStyle} />
        </label>
        {error && <p style={{ color: "var(--status-critical)" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "var(--series-cognition)" }}
        >
          {loading ? "Creating…" : "Create and continue"}
        </button>
      </form>
    </div>
  );
}
