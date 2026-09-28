import { listSurveyResponsesFull } from "@/lib/data";
import {
  computeMaxDiffUtilities,
  categoryShares,
  computeFramingEffect,
  computeWedgeMatrix,
  computePortfolioCurrency,
  tallyMultiSelect,
  tallySingleSelect,
  attentionCheckPassRate,
  SurveyResponseFull,
} from "@/lib/analytics";
import { HBarChart, Legend, StatTile, StatusBadge, ScatterQuadrant, CATEGORY_COLOR, CATEGORY_LABEL } from "@/components/Charts";
import SegmentFilter from "./SegmentFilter";
import {
  STAGE_OPTIONS,
  FORMAT_OPTIONS,
  OWNER_OPTIONS,
  WOULD_READ_OPTIONS,
  VIGNETTE_CHOICE_OPTIONS,
  SHARE_CHANGED_OPTIONS,
  EFFICIENCY_OPTIONS,
  PANEL_WILLINGNESS_OPTIONS,
  Opt,
} from "@/lib/surveyOptions";

export const dynamic = "force-dynamic";

function breakdownData(counts: Record<string, number>, options: Opt[], total: number) {
  return options
    .map((o) => ({ key: o.value, label: o.label, value: total ? (counts[o.value] ?? 0) / total : 0 }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

export default async function SurveyAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; maturity?: string }>;
}) {
  const params = await searchParams;
  const allRows = await listSurveyResponsesFull();
  const rows: SurveyResponseFull[] = allRows.filter((r) => {
    if (params.role && (r.section1 as { role?: string } | null)?.role !== params.role) return false;
    if (params.maturity && (r.section1 as { aiMaturity?: string } | null)?.aiMaturity !== params.maturity) return false;
    return true;
  });
  const complete = rows.filter((r) => r.status === "complete");

  const utilities = computeMaxDiffUtilities(rows);
  const shares = categoryShares(utilities);
  const framing = computeFramingEffect(rows);
  const wedge = computeWedgeMatrix(rows);
  const portfolio = computePortfolioCurrency(rows);
  const attention = attentionCheckPassRate(rows);

  const stageCounts = tallyMultiSelect(rows, (r) => r.section5?.stage);
  const formatCounts = tallyMultiSelect(rows, (r) => r.section5?.format);
  const ownerCounts = tallySingleSelect(rows, (r) => r.section5?.owner);
  const shareChangedCounts = tallySingleSelect(rows, (r) => r.section6?.shareChanged);
  const efficiencyCounts = tallySingleSelect(rows, (r) => r.section6?.efficiency);
  const panelCounts = tallySingleSelect(rows, (r) => r.section7?.panelWillingness);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Survey analytics</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {complete.length} complete response{complete.length === 1 ? "" : "s"} of {rows.length} started
            {params.role || params.maturity ? " (filtered)" : ""}. Target n ≥ 60 for the arm comparison to
            have real power.
          </p>
        </div>
        <SegmentFilter />
      </div>

      {complete.length === 0 ? (
        <div className="rounded-lg border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}>
          <p style={{ color: "var(--text-secondary)" }}>No complete survey responses yet.</p>
        </div>
      ) : (
        <>
          {/* Framing effect first — per the analysis plan: report it before any favourable finding. */}
          <section className="rounded-lg border-2 p-5" style={{ background: "var(--surface)", borderColor: framing.flagged ? "var(--status-critical)" : "var(--gridline)" }}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>
                Framing effect — Arm A vs Arm B (report this first)
              </h2>
              <StatusBadge status={framing.nArmA > 0 && framing.nArmB > 0 ? (framing.flagged ? "fail" : "pass") : "insufficient_data"} />
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              If Arm B (shown the cognition/skills definitions) values cognition items far more than
              Arm A (never shown them), every other favourable number in this survey is a measurement
              of the pitch, not the market. K6 flags at a mean cognition-utility swing of {"≥"} 0.30.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatTile label="Arm A cognition utility" value={framing.armACognitionUtility.toFixed(2)} hint={`n=${framing.nArmA}`} />
              <StatTile label="Arm B cognition utility" value={framing.armBCognitionUtility.toFixed(2)} hint={`n=${framing.nArmB}`} />
              <StatTile label="Delta (B − A)" value={framing.delta.toFixed(2)} />
            </div>
          </section>

          {/* MaxDiff utility ranking */}
          <section>
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Item utility ranking (3B MaxDiff)</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Best-minus-worst share per item shown. Feeds assessment rubric weights.</p>
            <div className="mt-4">
              <Legend items={[
                { label: "Cognition", color: CATEGORY_COLOR.cognition },
                { label: "Skill", color: CATEGORY_COLOR.skill },
                { label: "Decoy", color: CATEGORY_COLOR.decoy },
              ]} />
              <div className="mt-3">
                <HBarChart
                  data={utilities.map((u) => ({ key: u.code, label: `${u.code} · ${u.text}`, value: u.utility, color: CATEGORY_COLOR[u.category] }))}
                />
              </div>
            </div>
          </section>

          {/* Cognition vs Skills vs Decoy share */}
          <section>
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Cognition vs. Skills share of preference</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Mean utility by category. Feeds K2 and the core positioning claim.</p>
            <div className="mt-4">
              <HBarChart
                data={shares.map((s) => ({ key: s.category, label: CATEGORY_LABEL[s.category], value: s.meanUtility, color: CATEGORY_COLOR[s.category] }))}
              />
            </div>
          </section>

          {/* Value x assessability */}
          <section>
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Value × assessability — the wedge</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              High value crossed with &ldquo;hardest to assess&rdquo; (3B.2). The top-right is where a
              credential has somewhere to sit — if that cell is empty, there is no wedge.
            </p>
            <div className="mt-4">
              <ScatterQuadrant
                points={wedge.map((w) => ({ key: w.code, label: `${w.code} · ${w.text}`, x: w.utility, y: w.hardestToAssessShare, color: CATEGORY_COLOR[w.category] }))}
              />
              <Legend items={[
                { label: "Cognition", color: CATEGORY_COLOR.cognition },
                { label: "Skill", color: CATEGORY_COLOR.skill },
                { label: "Decoy", color: CATEGORY_COLOR.decoy },
              ]} />
            </div>
          </section>

          {/* Portfolio currency */}
          <section>
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Portfolio currency (K3)</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Artefact vignette, Section 4. Whether documented process evidence has real currency.</p>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>4.1 Who gets the interview</h3>
                <div className="mt-2">
                  <HBarChart data={breakdownData(portfolio.choiceBreakdown, VIGNETTE_CHOICE_OPTIONS, portfolio.n)} formatValue={(v) => `${(v * 100).toFixed(0)}%`} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>4.2 Would they actually read it</h3>
                <div className="mt-2">
                  <HBarChart data={breakdownData(portfolio.wouldReadBreakdown, WOULD_READ_OPTIONS, portfolio.n)} formatValue={(v) => `${(v * 100).toFixed(0)}%`} />
                </div>
              </div>
            </div>
          </section>

          {/* Signal slot and format */}
          <section>
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Signal slot and format (K4)</h2>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>5.1 Stage it would be used</h3>
                <div className="mt-2">
                  <HBarChart data={breakdownData(stageCounts, STAGE_OPTIONS, complete.length)} formatValue={(v) => `${(v * 100).toFixed(0)}%`} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>5.2 Required format</h3>
                <div className="mt-2">
                  <HBarChart data={breakdownData(formatCounts, FORMAT_OPTIONS, complete.length)} formatValue={(v) => `${(v * 100).toFixed(0)}%`} />
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>5.3 Who owns the decision (buyer vs. user)</h3>
              <div className="mt-2">
                <HBarChart data={breakdownData(ownerCounts, OWNER_OPTIONS, complete.length)} formatValue={(v) => `${(v * 100).toFixed(0)}%`} />
              </div>
            </div>
          </section>

          {/* Skilling to efficiency */}
          <section>
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Skilling-to-efficiency reality</h2>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>6.3 Share who changed how they work</h3>
                <div className="mt-2">
                  <HBarChart data={breakdownData(shareChangedCounts, SHARE_CHANGED_OPTIONS, complete.length)} formatValue={(v) => `${(v * 100).toFixed(0)}%`} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>6.4 Measured efficiency</h3>
                <div className="mt-2">
                  <HBarChart data={breakdownData(efficiencyCounts, EFFICIENCY_OPTIONS, complete.length)} formatValue={(v) => `${(v * 100).toFixed(0)}%`} />
                </div>
              </div>
            </div>
          </section>

          {/* Rater panel */}
          <section>
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Rater panel (7.2, feeds K5)</h2>
            <div className="mt-4">
              <HBarChart data={breakdownData(panelCounts, PANEL_WILLINGNESS_OPTIONS, complete.length)} formatValue={(v) => `${(v * 100).toFixed(0)}%`} />
            </div>
          </section>

          {/* Data quality */}
          <section className="rounded-lg border p-5" style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}>
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Data quality</h2>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatTile label="Attention check pass rate" value={attention.total ? `${((attention.passed / attention.total) * 100).toFixed(0)}%` : "—"} hint={`n=${attention.total}`} />
              <StatTile label="Started" value={`${rows.length}`} />
              <StatTile label="Completed" value={`${complete.length}`} hint={rows.length ? `${((complete.length / rows.length) * 100).toFixed(0)}% completion` : undefined} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
