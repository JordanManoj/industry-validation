import { CARD_BY_CODE, CARD_DECK, Category } from "./constructs";

// ---------------------------------------------------------------------------
// Types describing the joined rows the dashboard pages pass in. Kept
// decoupled from Drizzle's row types so the math here stays easy to reason
// about (and test) on its own.
// ---------------------------------------------------------------------------

export interface InterviewFull {
  id: string;
  code: string;
  arm: string;
  persona: string;
  interviewDone: boolean;
  panelAsk: string | null;
  tally: Record<string, boolean> | null; // c1..c7, s1..s4
  cardSort: {
    top1: number | null; top2: number | null; top3: number | null; top4: number | null; top5: number | null;
    resort1: number | null; resort2: number | null; resort3: number | null; resort4: number | null; resort5: number | null;
    hardestToCheck: number | null;
  } | null;
  vignette: {
    choice41: string | null;
    stage51: string | null;
  } | null;
}

export interface SurveyResponseFull {
  id: string;
  arm: string;
  status: string;
  attentionCheckPassed: boolean | null;
  section1: Record<string, unknown> | null;
  section3b: {
    maxDiffPicks?: { itemCodes: string[]; best: string; worst: string }[];
    hardestToAssess?: string | string[]; // single code in responses before 29 Sep, up to 4 after
    framingChanged?: string | null;
  } | null;
  section4: {
    choice?: string;
    wouldRead?: string;
  } | null;
  section5: {
    stage?: string[];
    format?: string[];
    owner?: string | null;
  } | null;
  section6: {
    shareChanged?: string | null;
    efficiency?: string | null;
  } | null;
  section7: { panelWillingness?: string | null } | null;
}

function completedOnly(rows: SurveyResponseFull[]) {
  return rows.filter((r) => r.status === "complete");
}

// ---------------------------------------------------------------------------
// 3B — MaxDiff utility scoring (best-worst counting method).
// utility(item) = (times chosen best - times chosen worst) / times shown
// A standard, dependency-free approximation; good enough for a live
// monitoring dashboard. Swap for hierarchical Bayes once n is large and the
// survey has really landed.
// ---------------------------------------------------------------------------

export interface ItemUtility {
  code: string;
  text: string;
  category: Category;
  shown: number;
  best: number;
  worst: number;
  utility: number; // -1..1
}

export function computeMaxDiffUtilities(rows: SurveyResponseFull[], arm?: "A" | "B"): ItemUtility[] {
  const pool = completedOnly(rows).filter((r) => !arm || r.arm === arm);
  const shown = new Map<string, number>();
  const best = new Map<string, number>();
  const worst = new Map<string, number>();
  for (const code of CARD_BY_CODE.keys()) {
    shown.set(code, 0);
    best.set(code, 0);
    worst.set(code, 0);
  }
  for (const r of pool) {
    for (const pick of r.section3b?.maxDiffPicks ?? []) {
      for (const code of pick.itemCodes) shown.set(code, (shown.get(code) ?? 0) + 1);
      best.set(pick.best, (best.get(pick.best) ?? 0) + 1);
      worst.set(pick.worst, (worst.get(pick.worst) ?? 0) + 1);
    }
  }
  return CARD_DECK.map((card) => {
    const s = shown.get(card.code) ?? 0;
    const b = best.get(card.code) ?? 0;
    const w = worst.get(card.code) ?? 0;
    return {
      code: card.code,
      text: card.text,
      category: card.category,
      shown: s,
      best: b,
      worst: w,
      utility: s > 0 ? (b - w) / s : 0,
    };
  }).sort((a, b) => b.utility - a.utility);
}

export interface CategoryShare {
  category: Category;
  meanUtility: number;
  itemCount: number;
}

export function categoryShares(utilities: ItemUtility[]): CategoryShare[] {
  const cats: Category[] = ["cognition", "skill", "decoy"];
  return cats.map((category) => {
    const items = utilities.filter((u) => u.category === category);
    const mean = items.length ? items.reduce((a, b) => a + b.utility, 0) / items.length : 0;
    return { category, meanUtility: mean, itemCount: items.length };
  });
}

// ---------------------------------------------------------------------------
// Framing effect — Arm A vs Arm B, on cognition-category mean utility.
// This is the survey's contribution to K6 (RQ7). "Large" is read against
// the same 1.5-card threshold the interview's within-subject re-sort uses,
// expressed here as a swing in mean cognition utility (utility runs -1..1;
// a 1.5-card shift on a 5-card top list is roughly a 0.3 swing).
// ---------------------------------------------------------------------------

export interface FramingEffect {
  armACognitionUtility: number;
  armBCognitionUtility: number;
  delta: number;
  nArmA: number;
  nArmB: number;
  flagged: boolean;
}

const FRAMING_FLAG_THRESHOLD = 0.3;

export function computeFramingEffect(rows: SurveyResponseFull[]): FramingEffect {
  const complete = completedOnly(rows);
  const armA = complete.filter((r) => r.arm === "A");
  const armB = complete.filter((r) => r.arm === "B");
  const utilA = categoryShares(computeMaxDiffUtilities(armA)).find((c) => c.category === "cognition")!.meanUtility;
  const utilB = categoryShares(computeMaxDiffUtilities(armB)).find((c) => c.category === "cognition")!.meanUtility;
  const delta = utilB - utilA;
  return {
    armACognitionUtility: utilA,
    armBCognitionUtility: utilB,
    delta,
    nArmA: armA.length,
    nArmB: armB.length,
    flagged: Math.abs(delta) >= FRAMING_FLAG_THRESHOLD,
  };
}

// ---------------------------------------------------------------------------
// Value x assessability — the wedge. High utility (3B) crossed with the
// share who named the item hardest to assess (3B.2).
// ---------------------------------------------------------------------------

export function hardestToAssessCodes(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return typeof value === "string" && value ? [value] : [];
}

export interface WedgeCell {
  code: string;
  text: string;
  category: Category;
  utility: number;
  hardestToAssessShare: number; // 0..1
}

export function computeWedgeMatrix(rows: SurveyResponseFull[]): WedgeCell[] {
  const complete = completedOnly(rows);
  const utilities = computeMaxDiffUtilities(complete);
  const counts = new Map<string, number>();
  for (const r of complete) {
    for (const code of hardestToAssessCodes(r.section3b?.hardestToAssess)) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  // Share of respondents who picked each item (they can pick up to 4).
  const denom = complete.filter((r) => hardestToAssessCodes(r.section3b?.hardestToAssess).length).length || 1;
  return utilities.map((u) => ({
    code: u.code,
    text: u.text,
    category: u.category,
    utility: u.utility,
    hardestToAssessShare: (counts.get(u.code) ?? 0) / denom,
  }));
}

// ---------------------------------------------------------------------------
// Section 4 — portfolio currency (K3).
// ---------------------------------------------------------------------------

export interface PortfolioCurrency {
  n: number;
  shareChoosingB: number;
  choiceBreakdown: Record<string, number>;
  wouldReadBreakdown: Record<string, number>;
  k3Pass: boolean | "insufficient_data";
}

export function computePortfolioCurrency(rows: SurveyResponseFull[]): PortfolioCurrency {
  const complete = completedOnly(rows).filter((r) => r.section4);
  const n = complete.length;
  const choiceBreakdown: Record<string, number> = {};
  const wouldReadBreakdown: Record<string, number> = {};
  let chosenB = 0;
  for (const r of complete) {
    const s4 = r.section4!;
    if (s4.choice) choiceBreakdown[s4.choice] = (choiceBreakdown[s4.choice] ?? 0) + 1;
    if (s4.choice === "b") chosenB += 1;
    if (s4.wouldRead) wouldReadBreakdown[s4.wouldRead] = (wouldReadBreakdown[s4.wouldRead] ?? 0) + 1;
  }
  const shareChoosingB = n ? chosenB / n : 0;
  return {
    n,
    shareChoosingB,
    choiceBreakdown,
    wouldReadBreakdown,
    k3Pass: n === 0 ? "insufficient_data" : shareChoosingB >= 0.6,
  };
}

// ---------------------------------------------------------------------------
// Section 5 — signal slot and format (K4), ownership.
// ---------------------------------------------------------------------------

export function tallyMultiSelect(rows: SurveyResponseFull[], pick: (r: SurveyResponseFull) => string[] | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of completedOnly(rows)) {
    for (const v of pick(r) ?? []) out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

export function tallySingleSelect(rows: SurveyResponseFull[], pick: (r: SurveyResponseFull) => string | null | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of completedOnly(rows)) {
    const v = pick(r);
    if (v) out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Kill criteria — K1-K6, pulling from interview data (live now) and survey
// data (once fielded) where both instruments feed the same signal.
// ---------------------------------------------------------------------------

export type KillStatus = "pass" | "fail" | "insufficient_data";

export interface KillCriterionResult {
  code: "K1" | "K2" | "K3" | "K4" | "K5" | "K6";
  label: string;
  threshold: string;
  value: string;
  status: KillStatus;
  consequence: string;
  source: string;
}

const MIN_INTERVIEWS_FOR_K1_K4 = 8;

export function computeKillCriteria(
  interviews: InterviewFull[],
  survey: SurveyResponseFull[]
): KillCriterionResult[] {
  const done = interviews.filter((i) => i.interviewDone);
  const results: KillCriterionResult[] = [];

  // K1 — unprompted cognition mentions in Block 2.
  {
    const denom = done.length;
    const withCognition = done.filter((i) => {
      const t = i.tally;
      if (!t) return false;
      return ["c1", "c2", "c3", "c4", "c5", "c6", "c7"].some((k) => t[k]);
    }).length;
    const pct = denom ? withCognition / denom : 0;
    const insufficient = denom < MIN_INTERVIEWS_FOR_K1_K4;
    results.push({
      code: "K1",
      label: "Unprompted cognition language in critical incidents",
      threshold: "≥ 40% of respondents",
      value: denom ? `${withCognition}/${denom} (${(pct * 100).toFixed(0)}%)` : "0/0",
      status: insufficient ? "insufficient_data" : pct >= 0.4 ? "pass" : "fail",
      consequence: "Cognition is real but not salient to buyers. Keep the pedagogy; change the sold object.",
      source: `Interviews (n=${denom} done)`,
    });
  }

  // K2 — median cognition cards in top 5 (interview card sort).
  {
    const withCardSort = done.filter((i) => i.cardSort?.top1);
    const cognitionCounts = withCardSort.map((i) => {
      const cs = i.cardSort!;
      const top = [cs.top1, cs.top2, cs.top3, cs.top4, cs.top5];
      return top.filter((n) => n != null && CARD_DECK.find((c) => c.number === n)?.category === "cognition").length;
    });
    const median = medianOf(cognitionCounts);
    results.push({
      code: "K2",
      label: "Median cognition cards in the top five",
      threshold: "≥ 2 of 5",
      value: withCardSort.length ? `median ${median} of 5 (n=${withCardSort.length})` : "no data",
      status: withCardSort.length === 0 ? "insufficient_data" : median >= 2 ? "pass" : "fail",
      consequence: "The market is buying tool skilling. Embed cognition inside it; stop leading with it.",
      source: `Interviews (n=${withCardSort.length} card-sorted)`,
    });
  }

  // K3 — preference for the documented candidate (interview 4.1 + survey 4.1).
  {
    const interviewChoices = done.filter((i) => i.vignette?.choice41).map((i) => i.vignette!.choice41);
    const surveyComplete = completedOnly(survey);
    const surveyChoices = surveyComplete.filter((r) => r.section4?.choice).map((r) => r.section4!.choice);
    const all = [...interviewChoices, ...surveyChoices];
    const chosenB = all.filter((c) => c === "b" || c === "B").length;
    const pct = all.length ? chosenB / all.length : 0;
    results.push({
      code: "K3",
      label: "Preference for the process-documented candidate",
      threshold: "≥ 60%",
      value: all.length ? `${chosenB}/${all.length} (${(pct * 100).toFixed(0)}%)` : "no data",
      status: all.length === 0 ? "insufficient_data" : pct >= 0.6 ? "pass" : "fail",
      consequence: "Portfolio evidence has no currency. It is a cost, not a moat.",
      source: `Interviews (n=${interviewChoices.length}) + survey (n=${surveyChoices.length})`,
    });
  }

  // K4 — can name a funnel stage (interview 5.1 + survey 5.1).
  {
    const interviewStages = done.filter((i) => i.vignette?.stage51 && i.vignette.stage51 !== "nowhere");
    const surveyComplete = completedOnly(survey);
    const surveyStages = surveyComplete.filter((r) => (r.section5?.stage ?? []).some((s) => s !== "nowhere"));
    const named = interviewStages.length + surveyStages.length;
    const denom = done.filter((i) => i.vignette?.stage51).length + surveyComplete.filter((r) => (r.section5?.stage ?? []).length > 0).length;
    results.push({
      code: "K4",
      label: "Can name a funnel stage for the signal",
      threshold: "Nobody can (fails only at zero)",
      value: denom ? `${named}/${denom} named a real stage` : "no data",
      status: denom === 0 ? "insufficient_data" : named > 0 ? "pass" : "fail",
      consequence: "No slot exists for the certificate. Pivot to institution-side outcomes.",
      source: `Interviews (n=${done.filter((i) => i.vignette?.stage51).length}) + survey (n=${surveyComplete.filter((r) => (r.section5?.stage ?? []).length > 0).length})`,
    });
  }

  // K5 — practitioners willing to blind-rate artefacts (interview panel ask + survey 7.2).
  {
    const interviewYes = done.filter((i) => i.panelAsk === "yes").length;
    const surveyYes = completedOnly(survey).filter((r) => r.section7?.panelWillingness === "yes").length;
    const total = interviewYes + surveyYes;
    results.push({
      code: "K5",
      label: "Practitioners agreeing to blind-rate artefacts",
      threshold: "≥ 4 saying Yes",
      value: `${total} (interviews: ${interviewYes}, survey: ${surveyYes})`,
      status: total >= 4 ? "pass" : done.length === 0 && survey.length === 0 ? "insufficient_data" : "fail",
      consequence: "Outcomes cannot be industry-validated. Downgrade every claim in the deck.",
      source: "Interviews (7.4) + survey (7.2)",
    });
  }

  // K6 — framing shift. Interview within-subject re-sort (Arm B) is primary;
  // survey between-subject Arm A vs B is the cross-check once fielded.
  {
    const armBWithResort = done.filter((i) => i.arm === "B" && i.cardSort?.top1 && i.cardSort?.resort1);
    const shifts = armBWithResort.map((i) => {
      const cs = i.cardSort!;
      const before = new Set([cs.top1, cs.top2, cs.top3, cs.top4, cs.top5]);
      const after = new Set([cs.resort1, cs.resort2, cs.resort3, cs.resort4, cs.resort5]);
      let changed = 0;
      for (const c of after) if (!before.has(c)) changed += 1;
      return changed;
    });
    const meanShift = shifts.length ? shifts.reduce((a, b) => a + b, 0) / shifts.length : null;
    const surveyFraming = computeFramingEffect(survey);
    const hasSurveyData = surveyFraming.nArmA > 0 && surveyFraming.nArmB > 0;
    const status: KillStatus =
      meanShift == null && !hasSurveyData
        ? "insufficient_data"
        : (meanShift != null && meanShift >= 1.5) || surveyFraming.flagged
        ? "fail"
        : "pass";
    results.push({
      code: "K6",
      label: "Framing shift after definitions are supplied",
      threshold: "Flags at ≥ 1.5 cards shifted (interview) / large Arm A-B swing (survey)",
      value:
        (meanShift != null ? `interview mean shift ${meanShift.toFixed(1)} cards (n=${shifts.length})` : "no interview re-sort data") +
        (hasSurveyData ? `; survey utility delta ${surveyFraming.delta.toFixed(2)} (A n=${surveyFraming.nArmA}, B n=${surveyFraming.nArmB})` : ""),
      status,
      consequence: "The enthusiasm is ours, not theirs. Demand is created, not latent — re-budget the go-to-market.",
      source: "Interviews (3.6B re-sort) + survey (3B Arm A vs B)",
    });
  }

  return results;
}

function medianOf(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}


