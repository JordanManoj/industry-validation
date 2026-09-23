import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { surveyResponses } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  section1Schema, section2Schema, section3aSchema, section3bSchema,
  section4Schema, section5Schema, section6Schema, section7Schema,
} from "@/lib/surveySchemas";

const SCHEMAS: Record<string, { safeParse: (v: unknown) => { success: boolean } }> = {
  section1: section1Schema,
  section2: section2Schema,
  section3a: section3aSchema,
  section3b: section3bSchema,
  section4: section4Schema,
  section5: section5Schema,
  section6: section6Schema,
  section7: section7Schema,
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { id, section, data } = body ?? {};
  if (!id || !section || !SCHEMAS[section]) {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
  const parsed = SCHEMAS[section].safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation failed" }, { status: 400 });
  }
  const db = await getDb();
  const [existing] = await db.select().from(surveyResponses).where(eq(surveyResponses.id, id));
  if (!existing || existing.status !== "in_progress") {
    return NextResponse.json({ ok: false, error: "response not found or already complete" }, { status: 404 });
  }
  await db.update(surveyResponses).set({ [section]: data }).where(eq(surveyResponses.id, id));
  return NextResponse.json({ ok: true });
}
