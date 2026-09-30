// Shown after submitting, and on any later visit to a submitted link.
export default function SurveyThanks() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Thanks for taking the survey</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Your response has been submitted and can no longer be changed. If you asked for the findings, we&apos;ll send them
        within three weeks.
      </p>
    </main>
  );
}
