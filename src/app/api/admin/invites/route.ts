import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { COOKIE_NAME, isValidSession } from "@/lib/auth";
import { createInvites, deleteUnusedInvite } from "@/lib/invites";

async function authorized(req: NextRequest): Promise<boolean> {
  return isValidSession(req.cookies.get(COOKIE_NAME)?.value);
}

const createSchema = z.object({
  people: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        email: z.string().trim().email().max(320).optional().or(z.literal("")),
        organisation: z.string().trim().max(200).optional(),
      })
    )
    .min(1)
    .max(500),
});

// POST { people: [{ name, email?, organisation? }] } → creates one personal link each.
export async function POST(req: NextRequest) {
  if (!(await authorized(req))) return NextResponse.json({ ok: false }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Each person needs a name, and emails must be valid." }, { status: 400 });
  }
  const invites = await createInvites(parsed.data.people);
  return NextResponse.json({ ok: true, count: invites.length });
}

// DELETE ?id=… → removes an invite nobody has opened yet.
export async function DELETE(req: NextRequest) {
  if (!(await authorized(req))) return NextResponse.json({ ok: false }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  const deleted = await deleteUnusedInvite(id);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: "This person has already started the survey, so the link can't be deleted." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
