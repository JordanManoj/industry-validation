import { isSurveyOpen } from "@/lib/settings";
import SurveyToggle from "./SurveyToggle";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const open = await isSurveyOpen();
  const token = process.env.SURVEY_LINK_TOKEN || "dev-token-change-me";

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Settings</h1>
      </div>

      <section className="rounded-lg border p-5" style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}>
        <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Survey gate</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          The Item Bank v0.9 is parked. Nobody can reach or complete the survey until you open it here.
        </p>
        <div className="mt-4">
          <SurveyToggle initialOpen={open} />
        </div>
      </section>

      <section className="rounded-lg border p-5" style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}>
        <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Secured survey link</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          The one link to send participants. It only works while the gate above is open. The path
          segment is set by the <code>SURVEY_LINK_TOKEN</code> environment variable — set your own
          value before deploying, and rotate it if it leaks.
        </p>
        <code
          className="mt-3 block break-all rounded-md border p-3 text-sm"
          style={{ background: "var(--page)", borderColor: "var(--gridline)", color: "var(--text-primary)" }}
        >
          {`{your-domain}/s/${token}`}
        </code>
      </section>
    </div>
  );
}
