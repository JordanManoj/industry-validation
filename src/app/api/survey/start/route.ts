import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { surveyResponses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isSurveyOpen } from "@/lib/settings";
import { assignArm } from "@/lib/arm";

export async function POST(req: NextRequest) {
  const open = await isSurveyOpen();
  if (!open) return NextResponse.json({ ok: false, error: "Survey is not open" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const db = await getDb();

  // Resume an existing in-progress response if the client already has one.
  if (body?.id) {
    const [existing] = await db.select().from(surveyResponses).where(eq(surveyResponses.id, body.id));
    if (existing && existing.status === "in_progress") {
      return NextResponse.json({ ok: true, id: existing.id, arm: existing.arm });
    }
  }

  const arm = assignArm();
  const [row] = await db.insert(surveyResponses).values({ arm }).returning();
  return NextResponse.json({ ok: true, id: row.id, arm: row.arm });
}
