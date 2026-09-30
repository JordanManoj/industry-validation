import { listInterviewsFull, listSurveyResponsesFull } from "@/lib/data";
import { computeKillCriteria } from "@/lib/analytics";
import { StatusBadge } from "@/components/Charts";

export const dynamic = "force-dynamic";

export default async function KillCriteriaPage() {
  const [interviewsList, surveyRows] = await Promise.all([listInterviewsFull(), listSurveyResponsesFull()]);
  const results = computeKillCriteria(interviewsList, surveyRows);
  const doneCount = interviewsList.filter((i) => i.interviewDone).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Kill criteria — pre-registered, live
        </h1>
        <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--text-secondary)" }}>
          Agreed before fielding. Recalculates as interviews and survey responses are logged. K1–K4
          read &ldquo;insufficient data&rdquo; until at least 8 interviews are marked done ({doneCount} done
          now). A FAIL is not a failed research project — it is the project working: each row already
          carries the decision it triggers, written down before any data arrived.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {results.map((k) => (
          <div key={k.code} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ background: "var(--gridline)", color: "var(--text-secondary)" }}>
                  {k.code}
                </span>
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>{k.label}</span>
              </div>
              <StatusBadge status={k.status} />
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Threshold</dt>
                <dd style={{ color: "var(--text-primary)" }}>{k.threshold}</dd>
              </div>
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Current value</dt>
                <dd className="tabular-nums" style={{ color: "var(--text-primary)" }}>{k.value}</dd>
              </div>
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Source</dt>
                <dd style={{ color: "var(--text-secondary)" }}>{k.source}</dd>
              </div>
              <div>
                <dt style={{ color: "var(--text-muted)" }}>If it fails</dt>
                <dd style={{ color: "var(--text-secondary)" }}>{k.consequence}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Note on denominators: every percentage divides by interviews marked done and survey responses
        marked complete, not by 16 or by the survey target. K6 inverts the usual reading — a large
        framing shift is the bad outcome, because it means the enthusiasm is yours rather than theirs.
      </p>
    </div>
  );
}
