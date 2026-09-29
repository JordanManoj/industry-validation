"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputStyle = { background: "var(--page)", borderColor: "var(--gridline)", color: "var(--text-primary)" } as const;
const inputCls = "rounded-md border px-3 py-2 text-sm";

interface Person {
  name: string;
  email?: string;
  organisation?: string;
}

// "Name, email, organisation" per line; email and organisation optional.
function parseBulk(text: string): Person[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", email = "", organisation = ""] = line.split(/\t|,/).map((p) => p.trim());
      return { name, email, organisation };
    });
}

export default function InviteForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [person, setPerson] = useState<Person>({ name: "", email: "", organisation: "" });
  const [bulk, setBulk] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const people = mode === "single" ? [person] : parseBulk(bulk);
    if (!people.length || people.some((p) => !p.name)) {
      setMessage({ ok: false, text: "Every person needs a name." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ people }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!body.ok) {
      setMessage({ ok: false, text: body.error ?? "Could not create the links." });
      return;
    }
    setMessage({ ok: true, text: `Created ${body.count} personal link${body.count === 1 ? "" : "s"} — copy them from the table below.` });
    setPerson({ name: "", email: "", organisation: "" });
    setBulk("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4 text-sm">
        {(["single", "bulk"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{ color: mode === m ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: mode === m ? 600 : 400 }}
          >
            {m === "single" ? "Add one person" : "Paste a list"}
          </button>
        ))}
      </div>

      {mode === "single" ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <input className={inputCls} style={inputStyle} placeholder="Name *" value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} />
          <input className={inputCls} style={inputStyle} placeholder="Email (optional)" type="email" value={person.email} onChange={(e) => setPerson({ ...person, email: e.target.value })} />
          <input className={inputCls} style={inputStyle} placeholder="Organisation (optional)" value={person.organisation} onChange={(e) => setPerson({ ...person, organisation: e.target.value })} />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <textarea
            className={inputCls}
            style={inputStyle}
            rows={6}
            placeholder={"One person per line: Name, email, organisation\nPriya Sharma, priya@example.com, Acme Ltd\nRahul Mehta, , Globex"}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
          />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            You can paste straight from Excel (Name, Email, Organisation columns). {parseBulk(bulk).length} people detected.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "var(--series-cognition)" }}
        >
          {saving ? "Creating…" : "Create personal link" + (mode === "bulk" ? "s" : "")}
        </button>
        {message && <span className="text-sm" style={{ color: message.ok ? "var(--status-good)" : "var(--status-critical)" }}>{message.text}</span>}
      </div>
    </div>
  );
}
