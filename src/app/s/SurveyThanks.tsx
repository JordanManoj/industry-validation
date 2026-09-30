"use client";

import { motion } from "motion/react";
import { BrandWordmark } from "@/components/Brand";
import { EASE_OUT } from "@/components/motion";

// Shown after submitting, and on any later visit to a submitted link.
export default function SurveyThanks() {
  return (
    <main className="brand-backdrop flex min-h-screen flex-col items-center justify-center gap-10 px-6 text-center">
      <BrandWordmark />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="card flex max-w-md flex-col items-center gap-5 px-8 py-10"
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--brand-green))", boxShadow: "0 12px 32px -8px color-mix(in srgb, var(--brand-green) 55%, transparent)" }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.45 }}
            />
          </svg>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4, ease: EASE_OUT }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Thanks for taking the survey</h1>
          <p className="mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Your response has been submitted and can no longer be changed. If you asked for the findings, we&apos;ll send them
            within three weeks.
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
