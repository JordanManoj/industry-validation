"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Lock } from "lucide-react";
import { BrandWordmark } from "@/components/Brand";
import { EASE_OUT } from "@/components/motion";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Login failed");
      setShake((n) => n + 1);
      return;
    }
    router.push(params.get("next") || "/admin");
    router.refresh();
  }

  return (
    <main className="brand-backdrop flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex justify-center">
          <BrandWordmark subtitle="Industry Validation" />
        </div>
        <motion.form
          key={shake}
          onSubmit={onSubmit}
          animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
          transition={{ duration: 0.4 }}
          className="card flex flex-col gap-4 p-6"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Researcher sign-in</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Interview log, analytics and survey controls.</p>
          </div>
          <label className="relative">
            <Lock size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              aria-label="Admin password"
              className="input pl-10"
            />
          </label>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm"
                style={{ color: "var(--status-critical)" }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <button type="submit" disabled={loading || !password} className="btn btn-primary group">
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
          </button>
        </motion.form>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
