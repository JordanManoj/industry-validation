import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { BrandWordmark } from "@/components/Brand";
import { FadeIn } from "@/components/motion";
import { checkSurveyToken } from "@/lib/auth";
import { getInviteByToken, getInviteResponse } from "@/lib/invites";
import { isSurveyOpen } from "@/lib/settings";
import { submittedCookieName } from "@/lib/surveyLink";
import SurveyWizard from "./SurveyWizard";
import SurveyThanks from "../SurveyThanks";

export const dynamic = "force-dynamic";

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="brand-backdrop flex min-h-screen flex-col items-center justify-center gap-10 px-6 text-center">
      <BrandWordmark />
      <FadeIn className="card flex max-w-md flex-col items-center gap-4 px-8 py-10" style={{ boxShadow: "var(--shadow-lg)" }}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
          <CalendarClock size={26} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h1>
        <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>{body}</p>
      </FadeIn>
    </main>
  );
}

export default async function SurveyEntry({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Either the shared anonymous link or a personal invite link.
  const invite = checkSurveyToken(token) ? null : await getInviteByToken(token);
  if (!invite && !checkSurveyToken(token)) return notFound();

  // Submitted from this browser already — the link stays frozen on the thank-you message.
  if ((await cookies()).has(submittedCookieName(token))) return <SurveyThanks />;

  const open = await isSurveyOpen();
  if (!open) {
    return <Message title="Not open yet" body="This survey hasn't opened yet. Please check back later, or contact whoever sent you this link." />;
  }

  if (invite) {
    const response = await getInviteResponse(invite.id);
    // Personal links freeze everywhere once submitted, whichever device opens them.
    if (response?.status === "complete") return <SurveyThanks />;
  }

  return <SurveyWizard token={token} personal={Boolean(invite)} />;
}
