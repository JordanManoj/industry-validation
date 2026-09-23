import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidSession } from "@/lib/auth";
import { setSurveyOpen } from "@/lib/settings";

async function authorized(req: NextRequest): Promise<boolean> {
  return isValidSession(req.cookies.get(COOKIE_NAME)?.value);
}

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (typeof body?.surveyOpen !== "boolean") {
    return NextResponse.json({ ok: false, error: "surveyOpen must be boolean" }, { status: 400 });
  }
  await setSurveyOpen(body.surveyOpen);
  return NextResponse.json({ ok: true });
}
