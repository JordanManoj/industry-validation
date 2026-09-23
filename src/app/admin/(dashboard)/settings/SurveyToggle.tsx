"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SurveyToggle({ initialOpen }: { initialOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function apply(nextOpen: boolean) {
    setLoading(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surveyOpen: nextOpen }),
    });
    setOpen(nextOpen);
    setLoading(false);
    setConfirming(false);
    router.refresh();
  }

  if (open) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium" style={{ color: "var(--status-good)" }}>Survey is OPEN</span>
        <button
          disabled={loading}
          onClick={() => apply(false)}
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--gridline)", color: "var(--text-primary)" }}
        >
          Close survey
        </button>
      </div>
    );
  }

  if (!confirming) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Survey is GATED (closed)</span>
        <button
          onClick={() => setConfirming(true)}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
          style={{ background: "var(--series-cognition)" }}
        >
          Open survey…
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-4" style={{ borderColor: "var(--status-critical)", background: "var(--surface)" }}>
      <p className="text-sm" style={{ color: "var(--text-primary)" }}>
        The item bank is marked &ldquo;do not field until after interview 10.&rdquo; Confirm interview 10
        has landed and Sections 3A/6 have been rewritten in practitioners&apos; own language before opening
        this to real participants.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          disabled={loading}
          onClick={() => apply(true)}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
          style={{ background: "var(--status-critical)" }}
        >
          Yes, open the survey now
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--gridline)", color: "var(--text-primary)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
