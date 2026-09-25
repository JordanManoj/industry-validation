import { getDb } from "@/db/client";
import { interviews, constructTallies, cardSorts, vignetteJourneys, verbatims, surveyResponses } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { InterviewFull, SurveyResponseFull } from "./analytics";

export async function listInterviewsFull(): Promise<InterviewFull[]> {
  const db = await getDb();
  const [ivs, tallies, sorts, vigs] = await Promise.all([
    db.select().from(interviews).orderBy(interviews.code),
    db.select().from(constructTallies),
    db.select().from(cardSorts),
    db.select().from(vignetteJourneys),
  ]);
  const talliesById = new Map(tallies.map((t) => [t.interviewId, t]));
  const sortsById = new Map(sorts.map((s) => [s.interviewId, s]));
  const vigById = new Map(vigs.map((v) => [v.interviewId, v]));

  return ivs.map((iv) => {
    const t = talliesById.get(iv.id);
    return {
      id: iv.id,
      code: iv.code,
      arm: iv.arm,
      persona: iv.persona,
      interviewDone: iv.interviewDone,
      panelAsk: iv.panelAsk,
      tally: t
        ? { c1: t.c1, c2: t.c2, c3: t.c3, c4: t.c4, c5: t.c5, c6: t.c6, c7: t.c7, s1: t.s1, s2: t.s2, s3: t.s3, s4: t.s4 }
        : null,
      cardSort: sortsById.get(iv.id) ?? null,
      vignette: vigById.get(iv.id) ?? null,
    };
  });
}

export async function getInterviewFull(id: string) {
  const db = await getDb();
  const [iv] = await db.select().from(interviews).where(eq(interviews.id, id));
  if (!iv) return null;
  const [tally] = await db.select().from(constructTallies).where(eq(constructTallies.interviewId, id));
  const [cardSort] = await db.select().from(cardSorts).where(eq(cardSorts.interviewId, id));
  const [vignette] = await db.select().from(vignetteJourneys).where(eq(vignetteJourneys.interviewId, id));
  const verbatimRows = await db.select().from(verbatims).where(eq(verbatims.interviewId, id)).orderBy(desc(verbatims.createdAt));
  return { interview: iv, tally: tally ?? null, cardSort: cardSort ?? null, vignette: vignette ?? null, verbatims: verbatimRows };
}

export async function listSurveyResponsesFull(): Promise<SurveyResponseFull[]> {
  const db = await getDb();
  const rows = await db.select().from(surveyResponses);
  return rows.map((r) => ({
    id: r.id,
    arm: r.arm,
    status: r.status,
    attentionCheckPassed: r.attentionCheckPassed,
    section1: (r.section1 as Record<string, unknown>) ?? null,
    section3b: (r.section3b as SurveyResponseFull["section3b"]) ?? null,
    section4: (r.section4 as SurveyResponseFull["section4"]) ?? null,
    section5: (r.section5 as SurveyResponseFull["section5"]) ?? null,
    section6: (r.section6 as SurveyResponseFull["section6"]) ?? null,
    section7: (r.section7 as SurveyResponseFull["section7"]) ?? null,
  }));
}

// Raw rows for the Responses page and CSV export, oldest first so the
// "Response #" numbering stays stable as new responses arrive.
export async function listSurveyResponsesRaw() {
  const db = await getDb();
  return db.select().from(surveyResponses).orderBy(asc(surveyResponses.startedAt));
}
