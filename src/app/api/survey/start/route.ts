import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { surveyResponses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkSurveyToken } from "@/lib/auth";
import { getInviteByToken, getInviteResponse } from "@/lib/invites";
import { isSurveyOpen } from "@/lib/settings";
import { assignArm } from "@/lib/arm";

type ResponseRow = typeof surveyResponses.$inferSelect;

// What the survey needs to resume: saved answers per section and the last page.
function resumePayload(r: ResponseRow) {
  return {
    ok: true,
    id: r.id,
    arm: r.arm,
    lastStep: r.lastStep,
    answers: {
      section1: r.section1, section2: r.section2, section3a: r.section3a, section3b: r.section3b,
      section4: r.section4, section5: r.section5, section6: r.section6, section7: r.section7,
    },
  };
}

export async function POST(req: NextRequest) {
  const open = await isSurveyOpen();
  if (!open) return NextResponse.json({ ok: false, error: "Survey is not open" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const token = typeof body?.token === "string" ? body.token : "";
  const invite = token && !checkSurveyToken(token) ? await getInviteByToken(token) : null;
  if (!invite && !checkSurveyToken(token)) {
    return NextResponse.json({ ok: false, error: "Invalid survey link" }, { status: 404 });
  }
  const db = await getDb();

  // Personal link: always the same response, whichever device it's opened on.
  if (invite) {
    const existing = await getInviteResponse(invite.id);
    if (existing?.status === "complete") {
      return NextResponse.json({ ok: false, error: "You've already completed this survey — thank you." }, { status: 409 });
    }
    if (existing) return NextResponse.json(resumePayload(existing));

    const [row] = await db
      .insert(surveyResponses)
      .values({ arm: assignArm(), inviteId: invite.id })
      .onConflictDoNothing()
      .returning();
    // Lost a race with another tab on the same link — use the row it created.
    const response = row ?? (await getInviteResponse(invite.id));
    return NextResponse.json(resumePayload(response!));
  }

  // Shared link: resume an existing in-progress response if the client already has one.
  if (body?.id) {
    const [existing] = await db.select().from(surveyResponses).where(eq(surveyResponses.id, body.id));
    if (existing && existing.status === "in_progress" && !existing.inviteId) {
      return NextResponse.json(resumePayload(existing));
    }
  }

  const [row] = await db.insert(surveyResponses).values({ arm: assignArm() }).returning();
  return NextResponse.json(resumePayload(row));
}
