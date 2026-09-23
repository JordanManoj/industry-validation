export default function ThankYou() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Thank you</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Your response has been recorded. If you asked for the findings, we&apos;ll send them within three weeks.
      </p>
    </main>
  );
}
