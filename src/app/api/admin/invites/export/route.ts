import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidSession } from "@/lib/auth";
import { listInvitesWithStatus } from "@/lib/invites";
import { csvCell, formatTimestamp } from "@/lib/responseExport";

export const dynamic = "force-dynamic";

const STATUS_LABEL = { not_started: "Not opened", in_progress: "Started", complete: "Completed" } as const;

// GET → CSV of every personal link (name, email, organisation, link, status), for mail merge.
export async function GET(req: NextRequest) {
  if (!(await isValidSession(req.cookies.get(COOKIE_NAME)?.value))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  const invites = await listInvitesWithStatus();
  const lines = [["Name", "Email", "Organisation", "Survey link", "Status", "Completed (UTC)"].map(csvCell).join(",")];
  for (const inv of invites) {
    lines.push(
      [inv.name, inv.email ?? "", inv.organisation ?? "", `${proto}://${host}/s/${inv.token}`, STATUS_LABEL[inv.status], formatTimestamp(inv.completedAt)]
        .map(csvCell)
        .join(",")
    );
  }
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse("\uFEFF" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="survey-links-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
