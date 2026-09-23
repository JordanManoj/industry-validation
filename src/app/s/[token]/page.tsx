import { notFound } from "next/navigation";
import { checkSurveyToken } from "@/lib/auth";
import { isSurveyOpen } from "@/lib/settings";
import SurveyWizard from "./SurveyWizard";

export const dynamic = "force-dynamic";

export default async function SurveyEntry({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!checkSurveyToken(token)) return notFound();

  const open = await isSurveyOpen();
  if (!open) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Not open yet</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          This survey hasn&apos;t opened yet. Please check back later, or contact whoever sent you this link.
        </p>
      </main>
    );
  }

  return <SurveyWizard token={token} />;
}
