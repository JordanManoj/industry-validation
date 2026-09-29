import { notFound } from "next/navigation";
import { checkSurveyToken } from "@/lib/auth";
import { getInviteByToken, getInviteResponse } from "@/lib/invites";
import { isSurveyOpen } from "@/lib/settings";
import SurveyWizard from "./SurveyWizard";

export const dynamic = "force-dynamic";

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h1>
      <p style={{ color: "var(--text-secondary)" }}>{body}</p>
    </main>
  );
}

export default async function SurveyEntry({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Either the shared anonymous link or a personal invite link.
  const invite = checkSurveyToken(token) ? null : await getInviteByToken(token);
  if (!invite && !checkSurveyToken(token)) return notFound();

  const open = await isSurveyOpen();
  if (!open) {
    return <Message title="Not open yet" body="This survey hasn't opened yet. Please check back later, or contact whoever sent you this link." />;
  }

  if (invite) {
    const response = await getInviteResponse(invite.id);
    if (response?.status === "complete") {
      return <Message title="Already completed" body="You've already completed this survey — thank you. Your response has been recorded." />;
    }
  }

  return <SurveyWizard token={token} personal={Boolean(invite)} />;
}
