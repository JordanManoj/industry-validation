import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidSession } from "@/lib/auth";
import { getDb } from "@/db/client";
import { interviews, constructTallies, cardSorts, vignetteJourneys } from "@/db/schema";

async function authorized(req: NextRequest): Promise<boolean> {
  return isValidSession(req.cookies.get(COOKIE_NAME)?.value);
}

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.code || !body?.arm || !body?.persona) {
    return NextResponse.json({ ok: false, error: "code, arm and persona are required" }, { status: 400 });
  }
  const db = await getDb();
  const [row] = await db
    .insert(interviews)
    .values({ code: body.code, arm: body.arm, persona: body.persona, date: body.date || null })
    .returning();
  await db.insert(constructTallies).values({ interviewId: row.id });
  await db.insert(cardSorts).values({ interviewId: row.id });
  await db.insert(vignetteJourneys).values({ interviewId: row.id });
  return NextResponse.json({ ok: true, id: row.id });
}
