"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }
  return (
    <button type="button" onClick={copy} className="rounded-md border px-2 py-1 text-xs" style={{ borderColor: "var(--gridline)", color: "var(--text-primary)" }}>
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

export function DeleteInviteButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await fetch(`/api/admin/invites?id=${id}`, { method: "DELETE" });
    setBusy(false);
    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-xs" style={{ color: "var(--text-muted)" }}>
        Delete
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs">
      <button type="button" disabled={busy} onClick={remove} style={{ color: "var(--status-critical)" }}>Confirm delete</button>
      <button type="button" onClick={() => setConfirming(false)} style={{ color: "var(--text-muted)" }}>Cancel</button>
    </span>
  );
}
