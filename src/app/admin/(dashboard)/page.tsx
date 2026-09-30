import Link from "next/link";
import { ArrowUpRight, BarChart3, ClipboardList, MessagesSquare, ShieldAlert, Users } from "lucide-react";
import { listInterviewsFull, listSurveyResponsesFull } from "@/lib/data";
import { isSurveyOpen } from "@/lib/settings";
import { StatTile } from "@/components/Charts";
import { Stagger, StaggerItem } from "@/components/motion";

// Always reflect live DB state — never freeze this at build time.
export const dynamic = "force-dynamic";

const AREAS = [
  { href: "/admin/interviews", title: "Interview log", body: "Log each interview within ten minutes of finishing it.", icon: MessagesSquare },
  { href: "/admin/kill-criteria", title: "Kill criteria", body: "K1–K6, pre-registered, computed live.", icon: ShieldAlert },
  { href: "/admin/survey-analytics", title: "Survey analytics", body: "MaxDiff utilities, framing effect, the wedge.", icon: BarChart3 },
  { href: "/admin/responses", title: "Responses", body: "Every answer, per respondent. Download as CSV.", icon: ClipboardList },
  { href: "/admin/invites", title: "Invites", body: "Personal survey links, and who has filled them in.", icon: Users },
];

export default async function AdminOverview() {
  const [interviewsList, surveyRows, surveyOpen] = await Promise.all([
    listInterviewsFull(),
    listSurveyResponsesFull(),
    isSurveyOpen(),
  ]);
  const done = interviewsList.filter((i) => i.interviewDone).length;
  const surveyComplete = surveyRows.filter((r) => r.status === "complete").length;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Research workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Overview</h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--text-secondary)" }}>
            Discovery interviews are the live instrument. The quantitative survey is {surveyOpen ? "open" : "gated"} — see Settings.
          </p>
        </div>
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{
            background: surveyOpen ? "color-mix(in srgb, var(--status-good) 14%, transparent)" : "var(--surface-2)",
            color: surveyOpen ? "var(--status-good)" : "var(--text-secondary)",
          }}
        >
          <span className="relative flex h-2 w-2">
            {surveyOpen && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "var(--status-good)" }} />}
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: surveyOpen ? "var(--status-good)" : "var(--text-muted)" }} />
          </span>
          Survey {surveyOpen ? "open" : "closed"}
        </span>
      </div>

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem><StatTile label="Interviews logged" value={`${done} / 16`} hint="minimum viable: 12" /></StaggerItem>
        <StaggerItem>
          <StatTile
            label="Arm split (done)"
            value={`${interviewsList.filter((i) => i.arm === "A" && i.interviewDone).length}A / ${interviewsList.filter((i) => i.arm === "B" && i.interviewDone).length}B`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile label="Survey status" value={surveyOpen ? "Open" : "Gated"} hint={surveyOpen ? "Accepting responses" : "Do not field until after interview 10"} />
        </StaggerItem>
        <StaggerItem><StatTile label="Survey completes" value={`${surveyComplete}`} hint="target n ≥ 60" /></StaggerItem>
      </Stagger>

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map(({ href, title, body, icon: Icon }) => (
          <StaggerItem key={href}>
            <Link
              href={href}
              className="card group flex h-full flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <Icon size={20} />
                </span>
                <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{title}</div>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{body}</p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
