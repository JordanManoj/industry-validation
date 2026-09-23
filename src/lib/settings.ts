import { getDb } from "@/db/client";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

const SURVEY_OPEN_KEY = "survey_open";

export async function isSurveyOpen(): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select().from(settings).where(eq(settings.key, SURVEY_OPEN_KEY)).limit(1);
  return Boolean(rows[0]?.value === true);
}

export async function setSurveyOpen(open: boolean): Promise<void> {
  const db = await getDb();
  await db
    .insert(settings)
    .values({ key: SURVEY_OPEN_KEY, value: open })
    .onConflictDoUpdate({ target: settings.key, set: { value: open } });
}
