// Turns stored survey_responses rows into readable question → answer pairs.
// Shared by the admin Responses page and the CSV download so both always
// use the same question wording and option labels as the survey itself.

import { surveyResponses } from "@/db/schema";
import { CARD_BY_CODE } from "@/lib/constructs";
import {
  AI_MATURITY_OPTIONS,
  ASSESS_AI_USE_OPTIONS,
  CONSTANT_SUM_CATEGORIES,
  DISTINCTION_MATCH_OPTIONS,
  DISTINGUISH_OPTIONS,
  EFFICIENCY_OPTIONS,
  FORMAL_TRAINING_OPTIONS,
  FORMAT_OPTIONS,
  FRAMING_CHANGED_OPTIONS,
  HIRE_VOLUME_OPTIONS,
  INTAKE_TREND_OPTIONS,
  ORG_AI_CAPABILITY_OPTIONS,
  ORG_AI_MEASURE_OPTIONS,
  ORG_SIZE_OPTIONS,
  OWNER_OPTIONS,
  PANEL_WILLINGNESS_OPTIONS,
  ROLE_OPTIONS,
  SECTOR_OPTIONS,
  SHARE_CHANGED_OPTIONS,
  SLIPPED_2_1_OPTIONS,
  STAGE_OPTIONS,
  VIGNETTE_CHOICE_OPTIONS,
  WOULD_READ_OPTIONS,
  type Opt,
} from "@/lib/surveyOptions";

export type ResponseRow = typeof surveyResponses.$inferSelect;
type Rec = Record<string, unknown>;

export interface Answer {
  question: string;
  answer: string;
}

export interface AnswerSection {
  title: string;
  answers: Answer[];
}

const SECTION_KEYS = ["section1", "section2", "section3a", "section3b", "section4", "section5", "section6", "section7"] as const;

function label(options: Opt[], value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  return options.find((o) => o.value === value)?.label ?? String(value);
}

function labels(options: Opt[], values: unknown): string {
  if (!Array.isArray(values)) return "";
  return values.map((v) => label(options, v)).join("; ");
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function card(code: unknown): string {
  if (typeof code !== "string" || !code) return "";
  const c = CARD_BY_CODE.get(code);
  return c ? `${code} — ${c.text}` : code;
}

function withOther(main: string, other: unknown): string {
  const o = text(other);
  return o ? `${main} (${o})` : main;
}

function sec(r: ResponseRow, key: (typeof SECTION_KEYS)[number]): Rec {
  return (r[key] as Rec | null) ?? {};
}

export function statusLabel(r: ResponseRow): string {
  if (r.status === "complete") return "Complete";
  if (r.status === "in_progress") return "Not finished";
  return r.status;
}

export function attentionLabel(r: ResponseRow): string {
  if (r.attentionCheckPassed === true) return "Passed";
  if (r.attentionCheckPassed === false) return "Failed";
  return "";
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m} min ${s} s` : `${s} s`;
}

export function formatTimestamp(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function hasAnyAnswers(r: ResponseRow): boolean {
  return SECTION_KEYS.some((k) => r[k] !== null);
}

// Readable sections, in survey order. Answers the respondent never gave come
// back as "" so the page can show a dash and the CSV an empty cell.
export function describeResponse(r: ResponseRow): AnswerSection[] {
  const s1 = sec(r, "section1");
  const s2 = sec(r, "section2");
  const s3a = sec(r, "section3a");
  const s3b = sec(r, "section3b");
  const s4 = sec(r, "section4");
  const s5 = sec(r, "section5");
  const s6 = sec(r, "section6");
  const s7 = sec(r, "section7");

  const picks = Array.isArray(s3b.maxDiffPicks) ? (s3b.maxDiffPicks as Rec[]) : [];

  const sections: AnswerSection[] = [
    {
      title: "1. About you",
      answers: [
        { question: "Which best describes your role?", answer: withOther(label(ROLE_OPTIONS, s1.role), s1.roleOther) },
        { question: "What sector?", answer: withOther(label(SECTOR_OPTIONS, s1.sector), s1.sectorOther) },
        { question: "How many people in your organisation?", answer: label(ORG_SIZE_OPTIONS, s1.orgSize) },
        { question: "Early-career hires (0–2 years) taken on in the last 12 months", answer: label(HIRE_VOLUME_OPTIONS, s1.hireVolume) },
        { question: "Compared with two years ago, your early-career intake is", answer: label(INTAKE_TREND_OPTIONS, s1.intakeTrend) },
        { question: "Share of your team using AI beyond a chat window", answer: label(AI_MATURITY_OPTIONS, s1.aiMaturity) },
        { question: "Does your organisation run formal AI training or certification?", answer: label(FORMAL_TRAINING_OPTIONS, s1.formalTraining) },
      ],
    },
    {
      title: "2. Current practice",
      answers: [
        { question: "Has a junior employee ever submitted AI work that was wrong or unchecked, and your team failed to catch the mistake before it went too far?", answer: label(SLIPPED_2_1_OPTIONS, s2.gotThroughUnprompted) },
        { question: "What let it through?", answer: text(s2.whatLetItThrough) },
        { question: "When you assess an early-career candidate, are they allowed to use AI?", answer: label(ASSESS_AI_USE_OPTIONS, s2.assessAiUse) },
        { question: "What are you watching for?", answer: text(s2.whatWatchingFor) },
      ],
    },
    {
      title: "3A. The distinction (Arm B only)",
      answers: [
        { question: "Does that distinction match how you think about it?", answer: label(DISTINCTION_MATCH_OPTIONS, s3a.distinctionMatch) },
        { question: "How would you cut it?", answer: text(s3a.howCutDifferently) },
      ],
    },
    {
      title: "3B. What matters most (MaxDiff)",
      answers: [
        ...[0, 1, 2, 3, 4].flatMap((i) => {
          const p = picks.find((x) => x.setIndex === i) ?? picks[i] ?? {};
          return [
            { question: `Set ${i + 1} — most important`, answer: card(p.best) },
            { question: `Set ${i + 1} — least important`, answer: card(p.worst) },
          ];
        }),
        { question: "Which one of those is hardest to assess in your hiring process today?", answer: card(s3b.hardestToAssess) },
        { question: "Did the skills/cognition distinction change how you answered? (Arm B only)", answer: label(FRAMING_CHANGED_OPTIONS, s3b.framingChanged) },
      ],
    },
    {
      title: "4. The two candidates",
      answers: [
        { question: "Which one gets the interview?", answer: label(VIGNETTE_CHOICE_OPTIONS, s4.choice) },
        { question: "Would you actually read Candidate B's record?", answer: label(WOULD_READ_OPTIONS, s4.wouldRead) },
      ],
    },
    {
      title: "5. Where it would fit",
      answers: [
        { question: "At which stage would a record like Candidate B's realistically be used?", answer: labels(STAGE_OPTIONS, s5.stage) },
        { question: "In what form would it have to arrive to be usable?", answer: labels(FORMAT_OPTIONS, s5.format) },
        { question: "Who decides whether a new candidate signal enters your hiring process?", answer: label(OWNER_OPTIONS, s5.owner) },
        { question: "Attention check (correct answer: A shorter ramp-up expectation)", answer: label(CONSTANT_SUM_CATEGORIES, s5.attentionCheck) },
        { question: "First question you'd ask a college with assessed evidence of this?", answer: text(s5.firstQuestion) },
      ],
    },
    {
      title: "6. Your organisation",
      answers: [
        { question: "What is your organisation doing on AI capability for its own people?", answer: labels(ORG_AI_CAPABILITY_OPTIONS, s6.capability) },
        { question: "What do you measure about it?", answer: labels(ORG_AI_MEASURE_OPTIONS, s6.measure) },
        { question: "Of the people who completed AI training, what share changed how they work?", answer: label(SHARE_CHANGED_OPTIONS, s6.shareChanged) },
        { question: "Has AI skilling translated into measurable efficiency?", answer: label(EFFICIENCY_OPTIONS, s6.efficiency) },
        { question: "Do you distinguish training people to use AI from training them to think alongside it?", answer: label(DISTINGUISH_OPTIONS, s6.distinguish) },
        { question: "One thing about AI capability you'd measure if you could", answer: text(s6.oneThingToMeasure) },
      ],
    },
    {
      title: "7. Close",
      answers: [
        { question: "Anything the survey didn't ask about and should have?", answer: text(s7.missedAnything) },
        { question: "Willing to score anonymised student work (rater panel)?", answer: label(PANEL_WILLINGNESS_OPTIONS, s7.panelWillingness) },
        { question: "Email for findings", answer: text(s7.email) },
      ],
    },
  ];

  return sections;
}

// ---- CSV ----

// Excel runs cells starting with these as formulas; respondents type free
// text, so neutralise them.
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export interface NumberedResponse {
  number: number; // position among all responses, oldest first — same on page and CSV
  row: ResponseRow;
}

export function numberResponses(rows: ResponseRow[]): NumberedResponse[] {
  return rows.map((row, i) => ({ number: i + 1, row }));
}

export function responsesToCsv(entries: NumberedResponse[]): string {
  const meta = ["Response #", "Response ID", "Status", "Arm", "Started (UTC)", "Completed (UTC)", "Duration (seconds)", "Attention check"];
  const template = describeResponse({} as ResponseRow);
  const questionHeaders = template.flatMap((s) => s.answers.map((a) => `${s.title.split(".")[0]}. ${a.question}`));

  const lines = [[...meta, ...questionHeaders].map(csvCell).join(",")];
  for (const { number, row: r } of entries) {
    const answers = describeResponse(r).flatMap((s) => s.answers.map((a) => a.answer));
    const cells = [
      String(number),
      r.id,
      statusLabel(r),
      r.arm,
      formatTimestamp(r.startedAt),
      formatTimestamp(r.completedAt),
      r.durationSeconds?.toString() ?? "",
      attentionLabel(r),
      ...answers,
    ];
    lines.push(cells.map(csvCell).join(","));
  }
  // BOM so Excel opens it as UTF-8 (en dashes, curly quotes in answers).
  return "﻿" + lines.join("\r\n") + "\r\n";
}
