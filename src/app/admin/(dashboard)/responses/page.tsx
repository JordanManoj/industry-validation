import Link from "next/link";
import { listSurveyResponsesRaw } from "@/lib/data";
import {
  attentionLabel,
  describeResponse,
  formatDuration,
  formatTimestamp,
  hasAnyAnswers,
  numberResponses,
  statusLabel,
} from "@/lib/responseExport";

export const dynamic = "force-dynamic";

export default async function ResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show } = await searchParams;
  const showAll = show === "all";

  const all = numberResponses(await listSurveyResponsesRaw());
  const completeCount = all.filter((e) => e.row.status === "complete").length;
  // Newest first on screen; numbers stay tied to arrival order.
  const visible = all.filter((e) => showAll || e.row.status === "complete").reverse();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Survey responses</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {completeCount} complete · {all.length - completeCount} started but not finished. Click a response to read every answer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/responses?status=complete"
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--series-cognition)" }}
          >
            Download CSV (complete)
          </a>
          <a
            href="/api/admin/responses?status=all"
            className="rounded-md border px-4 py-2 text-sm"
            style={{ borderColor: "var(--gridline)", color: "var(--text-primary)" }}
          >
            Download CSV (all)
          </a>
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <Link
          href="/admin/responses"
          style={{ color: showAll ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: showAll ? 400 : 600 }}
        >
          Complete only
        </Link>
        <Link
          href="/admin/responses?show=all"
          style={{ color: showAll ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: showAll ? 600 : 400 }}
        >
          All, including unfinished
        </Link>
      </div>

      {visible.length === 0 && (
        <p className="rounded-lg border p-6 text-sm" style={{ borderColor: "var(--gridline)", color: "var(--text-secondary)" }}>
          No {showAll ? "" : "complete "}responses yet.
        </p>
      )}

      {visible.map(({ number, row }) => {
        const attention = attentionLabel(row);
        return (
          <details
            key={row.id}
            className="rounded-lg border"
            style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}
          >
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm">
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Response #{number}</span>
              <span style={{ color: row.status === "complete" ? "var(--status-good)" : "var(--text-muted)" }}>
                {statusLabel(row)}
              </span>
              <span style={{ color: "var(--text-secondary)" }}>Arm {row.arm}</span>
              <span style={{ color: "var(--text-secondary)" }}>Started {formatTimestamp(row.startedAt)}</span>
              {row.durationSeconds ? (
                <span style={{ color: "var(--text-secondary)" }}>{formatDuration(row.durationSeconds)}</span>
              ) : null}
              {attention && (
                <span style={{ color: attention === "Passed" ? "var(--status-good)" : "var(--status-critical)" }}>
                  Attention check {attention.toLowerCase()}
                </span>
              )}
            </summary>

            <div className="flex flex-col gap-5 border-t p-4" style={{ borderColor: "var(--gridline)" }}>
              {!hasAnyAnswers(row) ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Opened the survey but didn&apos;t save any answers.
                </p>
              ) : (
                describeResponse(row)
                  .filter((s) => row.arm === "B" || !s.title.startsWith("3A"))
                  .map((s) => (
                    <section key={s.title}>
                      <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{s.title}</h3>
                      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        {s.answers.map((a) => (
                          <div key={a.question} className="contents">
                            <dt style={{ color: "var(--text-secondary)" }}>{a.question}</dt>
                            <dd className="whitespace-pre-wrap" style={{ color: a.answer ? "var(--text-primary)" : "var(--text-muted)" }}>
                              {a.answer || "—"}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))
              )}
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Response ID: {row.id}</p>
            </div>
          </details>
        );
      })}
    </div>
  );
}
