import Link from "next/link";
import { listInterviewsFull, listSurveyResponsesFull } from "@/lib/data";
import { isSurveyOpen } from "@/lib/settings";
import { StatTile } from "@/components/Charts";

// Always reflect live DB state — never freeze this at build time.
export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [interviewsList, surveyRows, surveyOpen] = await Promise.all([
    listInterviewsFull(),
    listSurveyResponsesFull(),
    isSurveyOpen(),
  ]);
  const done = interviewsList.filter((i) => i.interviewDone).length;
  const surveyComplete = surveyRows.filter((r) => r.status === "complete").length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Overview
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Discovery interviews are the live instrument. The quantitative survey is{" "}
          {surveyOpen ? "open" : "gated"} — see Settings.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Interviews logged" value={`${done} / 16`} hint="minimum viable: 12" />
        <StatTile label="Interviews done, this arm split" value={`${interviewsList.filter((i) => i.arm === "A" && i.interviewDone).length}A / ${interviewsList.filter((i) => i.arm === "B" && i.interviewDone).length}B`} />
        <StatTile label="Survey status" value={surveyOpen ? "Open" : "Gated"} hint={surveyOpen ? "Accepting responses" : "Do not field until after interview 10"} />
        <StatTile label="Survey completes" value={`${surveyComplete}`} hint="target n ≥ 60" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/interviews"
          className="rounded-lg border p-5"
          style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}
        >
          <div className="font-medium" style={{ color: "var(--text-primary)" }}>Interview log →</div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Log each interview within ten minutes of finishing it.
          </p>
        </Link>
        <Link
          href="/admin/kill-criteria"
          className="rounded-lg border p-5"
          style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}
        >
          <div className="font-medium" style={{ color: "var(--text-primary)" }}>Kill criteria →</div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            K1–K6, pre-registered, live.
          </p>
        </Link>
        <Link
          href="/admin/survey-analytics"
          className="rounded-lg border p-5"
          style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}
        >
          <div className="font-medium" style={{ color: "var(--text-primary)" }}>Survey analytics →</div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            MaxDiff utilities, framing effect, the wedge.
          </p>
        </Link>
      </div>
    </div>
  );
}
