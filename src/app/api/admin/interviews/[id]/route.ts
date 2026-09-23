import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidSession } from "@/lib/auth";
import { getDb } from "@/db/client";
import { interviews, constructTallies, cardSorts, vignetteJourneys, verbatims } from "@/db/schema";
import { eq } from "drizzle-orm";

async function authorized(req: NextRequest): Promise<boolean> {
  return isValidSession(req.cookies.get(COOKIE_NAME)?.value);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorized(req))) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  const db = await getDb();

  if (body.interview) {
    await db.update(interviews).set({ ...body.interview, updatedAt: new Date() }).where(eq(interviews.id, id));
  }
  if (body.tally) {
    await db
      .insert(constructTallies)
      .values({ interviewId: id, ...body.tally })
      .onConflictDoUpdate({ target: constructTallies.interviewId, set: body.tally });
  }
  if (body.cardSort) {
    await db
      .insert(cardSorts)
      .values({ interviewId: id, ...body.cardSort })
      .onConflictDoUpdate({ target: cardSorts.interviewId, set: body.cardSort });
  }
  if (body.vignette) {
    await db
      .insert(vignetteJourneys)
      .values({ interviewId: id, ...body.vignette })
      .onConflictDoUpdate({ target: vignetteJourneys.interviewId, set: body.vignette });
  }
  if (body.newVerbatim) {
    await db.insert(verbatims).values({ interviewId: id, ...body.newVerbatim });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorized(req))) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;
  const db = await getDb();
  await db.delete(interviews).where(eq(interviews.id, id));
  return NextResponse.json({ ok: true });
}
