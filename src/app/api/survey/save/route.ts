import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { surveyResponses } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  section1DraftSchema, section2Schema, section3aSchema, section3bDraftSchema,
  section4DraftSchema, section5Schema, section6Schema, section7Schema,
} from "@/lib/surveySchemas";

// Saving accepts half-finished required sections (draft schemas) so the Save
// button works mid-page; /api/survey/complete re-checks the strict schemas.
const SCHEMAS: Record<string, { safeParse: (v: unknown) => { success: boolean } }> = {
  section1: section1DraftSchema,
  section2: section2Schema,
  section3a: section3aSchema,
  section3b: section3bDraftSchema,
  section4: section4DraftSchema,
  section5: section5Schema,
  section6: section6Schema,
  section7: section7Schema,
};

const STEP_KEYS = new Set(["intro", "s1", "s2", "s3a", "s3b", "s4", "s5", "s6", "s7"]);

// POST { id, section?, data?, step? } — saves one section's answers and/or the
// page the respondent is on (used by Resume).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { id, section, data, step } = body ?? {};
  const hasSection = section !== undefined;
  const hasStep = typeof step === "string" && STEP_KEYS.has(step);
  if (!id || (!hasSection && !hasStep) || (hasSection && !SCHEMAS[section])) {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
  if (hasSection && !SCHEMAS[section].safeParse(data).success) {
    return NextResponse.json({ ok: false, error: "validation failed" }, { status: 400 });
  }
  const db = await getDb();
  const [existing] = await db.select().from(surveyResponses).where(eq(surveyResponses.id, id));
  if (!existing || existing.status !== "in_progress") {
    return NextResponse.json({ ok: false, error: "response not found or already complete" }, { status: 404 });
  }
  await db
    .update(surveyResponses)
    .set({ ...(hasSection ? { [section]: data } : {}), ...(hasStep ? { lastStep: step } : {}) })
    .where(eq(surveyResponses.id, id));
  return NextResponse.json({ ok: true });
}
