import { randomBytes } from "node:crypto";
import { desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { surveyInvites, surveyResponses } from "@/db/schema";

export type Invite = typeof surveyInvites.$inferSelect;
export type InviteStatus = "not_started" | "in_progress" | "complete";

export interface InviteWithStatus extends Invite {
  status: InviteStatus;
  responseId: string | null;
  completedAt: Date | null;
}

export interface NewInvite {
  name: string;
  email?: string | null;
  organisation?: string | null;
}

function newToken(): string {
  return randomBytes(12).toString("base64url");
}

export async function createInvites(people: NewInvite[]): Promise<Invite[]> {
  const db = await getDb();
  const values = people.map((p) => ({
    token: newToken(),
    name: p.name.trim(),
    email: p.email?.trim() || null,
    organisation: p.organisation?.trim() || null,
  }));
  return db.insert(surveyInvites).values(values).returning();
}

export async function getInviteByToken(token: string): Promise<Invite | null> {
  const db = await getDb();
  const [invite] = await db.select().from(surveyInvites).where(eq(surveyInvites.token, token)).limit(1);
  return invite ?? null;
}

// The response started from this invite, if any. One invite = one response.
export async function getInviteResponse(inviteId: string) {
  const db = await getDb();
  const [row] = await db.select().from(surveyResponses).where(eq(surveyResponses.inviteId, inviteId)).limit(1);
  return row ?? null;
}

export async function listInvitesWithStatus(): Promise<InviteWithStatus[]> {
  const db = await getDb();
  const invites = await db.select().from(surveyInvites).orderBy(desc(surveyInvites.createdAt));
  const responses = await db
    .select({ id: surveyResponses.id, inviteId: surveyResponses.inviteId, status: surveyResponses.status, completedAt: surveyResponses.completedAt })
    .from(surveyResponses)
    .where(isNotNull(surveyResponses.inviteId));
  const byInvite = new Map(responses.map((r) => [r.inviteId, r]));
  return invites.map((inv) => {
    const r = byInvite.get(inv.id);
    return {
      ...inv,
      status: !r ? "not_started" : r.status === "complete" ? "complete" : "in_progress",
      responseId: r?.id ?? null,
      completedAt: r?.completedAt ?? null,
    };
  });
}

// Only invites nobody has opened yet can be deleted, so a response never
// loses the record of who gave it.
export async function deleteUnusedInvite(id: string): Promise<boolean> {
  const db = await getDb();
  if (await getInviteResponse(id)) return false;
  const deleted = await db.delete(surveyInvites).where(eq(surveyInvites.id, id)).returning({ id: surveyInvites.id });
  return deleted.length > 0;
}

export async function listInvitesById(): Promise<Map<string, Invite>> {
  const db = await getDb();
  const invites = await db.select().from(surveyInvites);
  return new Map(invites.map((i) => [i.id, i]));
}
