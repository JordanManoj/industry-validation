import Link from "next/link";
import { headers } from "next/headers";
import { listInvitesWithStatus, type InviteStatus } from "@/lib/invites";
import { isSurveyOpen } from "@/lib/settings";
import { formatTimestamp } from "@/lib/responseExport";
import InviteForm from "./InviteForm";
import { CopyLinkButton, DeleteInviteButton } from "./InviteRowActions";

export const dynamic = "force-dynamic";

const STATUS: Record<InviteStatus, { label: string; color: string }> = {
  not_started: { label: "Not opened", color: "var(--text-muted)" },
  in_progress: { label: "Started", color: "var(--status-warning)" },
  complete: { label: "Completed", color: "var(--status-good)" },
};

export default async function InvitesPage() {
  const [invites, open] = await Promise.all([listInvitesWithStatus(), isSurveyOpen()]);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const linkFor = (token: string) => `${proto}://${host}/s/${token}`;

  const counts = { not_started: 0, in_progress: 0, complete: 0 } as Record<InviteStatus, number>;
  for (const i of invites) counts[i.status] += 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Personal survey links</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            One link per person, so you can see who has filled the survey in. {invites.length} sent · {counts.complete} completed ·{" "}
            {counts.in_progress} started · {counts.not_started} not opened.
          </p>
        </div>
        {invites.length > 0 && (
          <a
            href="/api/admin/invites/export"
            className="rounded-md border px-4 py-2 text-sm"
            style={{ borderColor: "var(--gridline)", color: "var(--text-primary)" }}
          >
            Download links (CSV)
          </a>
        )}
      </div>

      {!open && (
        <p className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--status-warning)", color: "var(--text-primary)" }}>
          The survey is closed, so these links show &quot;Not open yet&quot; until you open it in <Link href="/admin/settings" className="underline">Settings</Link>.
        </p>
      )}

      <section className="rounded-lg border p-5" style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}>
        <InviteForm />
      </section>

      {invites.length > 0 && (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--gridline)" }}>
          <table className="w-full text-left text-sm">
            <thead style={{ background: "var(--surface)", color: "var(--text-secondary)" }}>
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Organisation</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Link</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-t" style={{ borderColor: "var(--gridline)" }}>
                  <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{inv.name}</td>
                  <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{inv.email ?? "—"}</td>
                  <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{inv.organisation ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span style={{ color: STATUS[inv.status].color }}>{STATUS[inv.status].label}</span>
                    {inv.completedAt && (
                      <span className="block text-xs" style={{ color: "var(--text-muted)" }}>{formatTimestamp(inv.completedAt)}</span>
                    )}
                    {inv.status !== "not_started" && (
                      <Link href="/admin/responses?show=all" className="block text-xs underline" style={{ color: "var(--text-muted)" }}>
                        View response
                      </Link>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <code className="max-w-[16rem] truncate text-xs" style={{ color: "var(--text-muted)" }}>{linkFor(inv.token)}</code>
                      <CopyLinkButton url={linkFor(inv.token)} />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">{inv.status === "not_started" && <DeleteInviteButton id={inv.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
