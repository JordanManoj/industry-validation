import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isValidSession } from "@/lib/auth";
import { listSurveyResponsesRaw } from "@/lib/data";
import { numberResponses, responsesToCsv } from "@/lib/responseExport";

export const dynamic = "force-dynamic";

// GET /api/admin/responses?status=complete|all → CSV download.
export async function GET(req: NextRequest) {
  if (!(await isValidSession(req.cookies.get(COOKIE_NAME)?.value))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const onlyComplete = req.nextUrl.searchParams.get("status") !== "all";
  const entries = numberResponses(await listSurveyResponsesRaw()).filter(
    (e) => !onlyComplete || e.row.status === "complete"
  );

  const date = new Date().toISOString().slice(0, 10);
  const filename = `survey-responses-${onlyComplete ? "complete" : "all"}-${date}.csv`;
  return new NextResponse(responsesToCsv(entries), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
