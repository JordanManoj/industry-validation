import Link from "next/link";
import { listInterviewsFull } from "@/lib/data";
import { PERSONAS } from "@/lib/constructs";

export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
  const rows = await listInterviewsFull();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Interview log</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            One row per interview. Log within ten minutes of finishing it.
          </p>
        </div>
        <Link
          href="/admin/interviews/new"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ background: "var(--series-cognition)" }}
        >
          + New interview
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--gridline)" }}>
        <table className="w-full text-left text-sm">
          <thead style={{ background: "var(--surface)" }}>
            <tr style={{ color: "var(--text-muted)" }}>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Arm</th>
              <th className="px-4 py-2 font-medium">Persona</th>
              <th className="px-4 py-2 font-medium">Done</th>
              <th className="px-4 py-2 font-medium">Panel ask</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t" style={{ borderColor: "var(--gridline)" }}>
                <td className="px-4 py-2 font-medium" style={{ color: "var(--text-primary)" }}>{r.code}</td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>{r.arm}</td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>{PERSONAS[r.persona] ?? r.persona}</td>
                <td className="px-4 py-2">
                  {r.interviewDone ? (
                    <span style={{ color: "var(--status-good)" }}>Y</span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>{r.panelAsk ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/interviews/${r.id}`} style={{ color: "var(--series-cognition)" }}>Edit →</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center" style={{ color: "var(--text-muted)" }}>
                  No interviews logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
