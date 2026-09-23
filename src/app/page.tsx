import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
        ClimbSphere — Industry Validation
      </h1>
      <p style={{ color: "var(--text-secondary)" }}>
        This tool supports the AI Cognition industry validation research programme —
        the interview log, the kill-criteria dashboard, and the (currently gated)
        quantitative survey.
      </p>
      <Link
        href="/admin"
        className="rounded-md px-4 py-2 text-sm font-medium text-white"
        style={{ background: "var(--series-cognition)" }}
      >
        Go to researcher dashboard
      </Link>
    </main>
  );
}
