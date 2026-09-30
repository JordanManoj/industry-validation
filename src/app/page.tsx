import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandWordmark } from "@/components/Brand";
import { FadeIn } from "@/components/motion";

export default function Home() {
  return (
    <main className="brand-backdrop flex min-h-screen items-center justify-center px-6">
      <div className="flex max-w-xl flex-col items-center gap-8 text-center">
        <FadeIn>
          <BrandWordmark subtitle="Industry Validation" />
        </FadeIn>
        <FadeIn delay={0.08}>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ color: "var(--text-primary)" }}>
            How employers value <span style={{ color: "var(--accent)" }}>AI judgement</span> in new hires
          </h1>
        </FadeIn>
        <FadeIn delay={0.16}>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            The research workspace for the AI Cognition programme — discovery interviews, pre-registered kill criteria,
            and the industry survey.
          </p>
        </FadeIn>
        <FadeIn delay={0.24}>
          <Link href="/admin" className="btn btn-primary group px-6 py-3 text-base">
            Researcher dashboard
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </FadeIn>
      </div>
    </main>
  );
}
