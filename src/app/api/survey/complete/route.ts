import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { surveyResponses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { section1Schema, section3bSchema, section4Schema, ATTENTION_CHECK_CORRECT } from "@/lib/surveySchemas";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = body?.id;
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

  const db = await getDb();
  const [existing] = await db.select().from(surveyResponses).where(eq(surveyResponses.id, id));
  if (!existing) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  if (existing.status === "complete") return NextResponse.json({ ok: true, alreadyComplete: true });

  // Sections 1, 3B and 4 are required — refuse to complete without them.
  const s1 = section1Schema.safeParse(existing.section1);
  const s3b = section3bSchema.safeParse(existing.section3b);
  const s4 = section4Schema.safeParse(existing.section4);
  if (!s1.success || !s3b.success || !s4.success) {
    return NextResponse.json({ ok: false, error: "required sections incomplete" }, { status: 400 });
  }

  const section5 = existing.section5 as { attentionCheck?: string } | null;
  const attentionCheckPassed = section5?.attentionCheck ? section5.attentionCheck === ATTENTION_CHECK_CORRECT : null;
  const durationSeconds = Math.round((Date.now() - new Date(existing.startedAt).getTime()) / 1000);

  await db
    .update(surveyResponses)
    .set({ status: "complete", completedAt: new Date(), durationSeconds, attentionCheckPassed })
    .where(eq(surveyResponses.id, id));

  return NextResponse.json({ ok: true });
}
