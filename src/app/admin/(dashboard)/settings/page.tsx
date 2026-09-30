import { headers } from "next/headers";
import { isSurveyOpen } from "@/lib/settings";
import SurveyToggle from "./SurveyToggle";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const open = await isSurveyOpen();
  const token = process.env.SURVEY_LINK_TOKEN || "dev-token-change-me";
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const surveyUrl = `${proto}://${host}/s/${token}`;

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Settings</h1>
      </div>

      <section className="card p-5">
        <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Survey gate</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          The Item Bank v0.9 is parked. Nobody can reach or complete the survey until you open it here.
        </p>
        <div className="mt-4">
          <SurveyToggle initialOpen={open} />
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Shared survey link (anonymous)</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          One link anyone can use — responses through it are anonymous. To see who has filled the
          survey in, send personal links from <a href="/admin/invites" className="underline">Invites</a> instead.
          Both only work while the gate above is open. The path segment is set by the{" "}
          <code>SURVEY_LINK_TOKEN</code> environment variable — rotate it if it leaks.
        </p>
        <a
          href={surveyUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block break-all rounded-md border p-3 font-mono text-sm"
          style={{ background: "var(--page)", borderColor: "var(--gridline)", color: "var(--text-primary)" }}
        >
          {surveyUrl}
        </a>
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          Uses the address you opened this page from — open the admin on the domain you want participants to see.
        </p>
      </section>
    </div>
  );
}
