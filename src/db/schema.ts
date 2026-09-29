import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uuid,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Interview log — the qualitative phase (Discovery Field Kit, 16 interviews).
// One row per sheet in the Response Capture Workbook, keyed by interviewId.
// ---------------------------------------------------------------------------

export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // R01..R16
  date: date("date"),
  arm: text("arm").notNull(), // 'A' | 'B'
  persona: text("persona").notNull(), // M1..M4
  name: text("name"),
  roleTitle: text("role_title"),
  organisation: text("organisation"),
  sector: text("sector"),
  hireVolumeBand: text("hire_volume_band"),
  aiMaturityBand: text("ai_maturity_band"),
  formalTraining: text("formal_training"),
  interviewDone: boolean("interview_done").notNull().default(false),
  panelAsk: text("panel_ask"), // 'yes' | 'conditional' | 'maybe' | 'no'
  panelCondition: text("panel_condition"),
  oneSurprise: text("one_surprise"),
  bestQuote: text("best_quote"),
  referrals: text("referrals"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Block 2 — spontaneous construct mentions. One row per interview.
export const constructTallies = pgTable("construct_tallies", {
  id: uuid("id").primaryKey().defaultRandom(),
  interviewId: uuid("interview_id")
    .notNull()
    .unique()
    .references(() => interviews.id, { onDelete: "cascade" }),
  c1: boolean("c1").notNull().default(false),
  c2: boolean("c2").notNull().default(false),
  c3: boolean("c3").notNull().default(false),
  c4: boolean("c4").notNull().default(false),
  c5: boolean("c5").notNull().default(false),
  c6: boolean("c6").notNull().default(false),
  c7: boolean("c7").notNull().default(false),
  s1: boolean("s1").notNull().default(false),
  s2: boolean("s2").notNull().default(false),
  s3: boolean("s3").notNull().default(false),
  s4: boolean("s4").notNull().default(false),
  otherConstruct: text("other_construct"),
});

// Block 3 — card sort. Card numbers 1-14 referencing the CARD_DECK constant.
export const cardSorts = pgTable("card_sorts", {
  id: uuid("id").primaryKey().defaultRandom(),
  interviewId: uuid("interview_id")
    .notNull()
    .unique()
    .references(() => interviews.id, { onDelete: "cascade" }),
  top1: integer("top1"),
  top2: integer("top2"),
  top3: integer("top3"),
  top4: integer("top4"),
  top5: integer("top5"),
  bottom1: integer("bottom1"),
  bottom2: integer("bottom2"),
  bottom3: integer("bottom3"),
  // Arm B only — question 3.6B, the within-subject re-sort after framing.
  resort1: integer("resort1"),
  resort2: integer("resort2"),
  resort3: integer("resort3"),
  resort4: integer("resort4"),
  resort5: integer("resort5"),
  hardestToFind: integer("hardest_to_find"),
  hardestToCheck: integer("hardest_to_check"), // interview 3.4
});

// Blocks 4 and 5 — the artefact vignette and the journey/signal questions.
export const vignetteJourneys = pgTable("vignette_journeys", {
  id: uuid("id").primaryKey().defaultRandom(),
  interviewId: uuid("interview_id")
    .notNull()
    .unique()
    .references(() => interviews.id, { onDelete: "cascade" }),
  choice41: text("choice_41"), // 'A' | 'B' | 'no_difference'
  why42: text("why_42"),
  wouldRead43: text("would_read_43"),
  unitOfValue44: text("unit_of_value_44"),
  exactWords44: text("exact_words_44"),
  distrust45: text("distrust_45"),
  missing46: text("missing_46"),
  stage51: text("stage_51"),
  owner52: text("owner_52"),
  format53: text("format_53"),
  competesWith54: text("competes_with_54"),
  firstQuestion55: text("first_question_55"),
});

// Verbatims — one row per quotable phrase, not tied 1:1 to an interview.
export const verbatims = pgTable("verbatims", {
  id: uuid("id").primaryKey().defaultRandom(),
  interviewId: uuid("interview_id")
    .notNull()
    .references(() => interviews.id, { onDelete: "cascade" }),
  block: text("block"),
  constructCode: text("construct_code"),
  quote: text("quote").notNull(),
  whyItMatters: text("why_it_matters"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Quantitative survey — Item Bank v0.9. Gated: see `settings.survey_open`.
// ---------------------------------------------------------------------------

export const surveyResponses = pgTable("survey_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  arm: text("arm").notNull(), // 'A' | 'B'
  status: text("status").notNull().default("in_progress"), // in_progress | complete | screened_out
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  durationSeconds: integer("duration_seconds"),
  attentionCheckPassed: boolean("attention_check_passed"),
  // Set when the respondent came in through a personal invite link.
  inviteId: uuid("invite_id").references(() => surveyInvites.id, { onDelete: "set null" }),
  // Each section stores its answers as JSON, validated against a zod schema
  // in code before every write. Keeps the schema stable while the item
  // wording is still expected to change after the interviews land.
  section1: jsonb("section1"),
  section2: jsonb("section2"),
  section3a: jsonb("section3a"),
  section3b: jsonb("section3b"),
  section4: jsonb("section4"),
  section5: jsonb("section5"),
  section6: jsonb("section6"),
  section7: jsonb("section7"),
}, (t) => [
  // One response per personal invite.
  uniqueIndex("survey_responses_invite_id_key").on(t.inviteId).where(sql`invite_id IS NOT NULL`),
]);

// ---------------------------------------------------------------------------
// Personal survey links — one per named respondent, so the team can see who
// has filled the survey in. The shared SURVEY_LINK_TOKEN link stays anonymous.
// ---------------------------------------------------------------------------

export const surveyInvites = pgTable("survey_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  organisation: text("organisation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Settings — small key/value store. Used for the survey open/closed gate.
// ---------------------------------------------------------------------------

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});
