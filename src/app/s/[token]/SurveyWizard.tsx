"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Clock, ListChecks, Send, ShieldCheck, Sparkles, FileText, NotebookPen } from "lucide-react";
import { buildMaxDiffSets, MaxDiffSet } from "@/lib/maxdiffDesign";
import { submittedCookieName } from "@/lib/surveyLink";
import { BrandWordmark } from "@/components/Brand";
import { EASE_OUT, SPRING } from "@/components/motion";
import {
  ROLE_OPTIONS, SECTOR_OPTIONS, ORG_SIZE_OPTIONS, HIRE_VOLUME_OPTIONS, INTAKE_TREND_OPTIONS,
  AI_MATURITY_OPTIONS, FORMAL_TRAINING_OPTIONS, SLIPPED_2_1_OPTIONS, ASSESS_AI_USE_OPTIONS,
  DISTINCTION_MATCH_OPTIONS, FRAMING_CHANGED_OPTIONS, VIGNETTE_CHOICE_OPTIONS, WOULD_READ_OPTIONS,
  STAGE_OPTIONS, FORMAT_OPTIONS, OWNER_OPTIONS,
  ORG_AI_CAPABILITY_OPTIONS, ORG_AI_MEASURE_OPTIONS, SHARE_CHANGED_OPTIONS, EFFICIENCY_OPTIONS,
  DISTINGUISH_OPTIONS, PANEL_WILLINGNESS_OPTIONS, Opt,
} from "@/lib/surveyOptions";

function storageKey(token: string) {
  return `iv_survey_${token}`;
}

type AnyRec = Record<string, unknown>;

const MAX_HARDEST_TO_ASSESS = 4;

// ---------------------------------------------------------------------------
// Answer controls
// ---------------------------------------------------------------------------

function OptionCard({
  selected,
  disabled,
  multi,
  label,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  multi?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className="group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition-colors duration-150 disabled:cursor-not-allowed"
      style={{
        borderColor: selected ? "var(--accent)" : "var(--gridline)",
        background: selected ? "var(--accent-soft)" : "var(--surface)",
        boxShadow: selected ? "0 0 0 1px var(--accent)" : "var(--shadow-sm)",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-colors ${multi ? "rounded-md" : "rounded-full"}`}
        style={{ borderColor: selected ? "var(--accent)" : "var(--baseline)", background: selected ? "var(--accent)" : "transparent" }}
      >
        <AnimatePresence initial={false}>
          {selected && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={SPRING}>
              {multi ? <Check size={13} strokeWidth={3.5} color="#fff" /> : <span className="block h-2 w-2 rounded-full bg-white" />}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span style={{ color: "var(--text-primary)" }}>{label}</span>
    </motion.button>
  );
}

function SingleSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Opt[] }) {
  return (
    <div role="radiogroup" className="flex flex-col gap-2">
      {options.map((o) => (
        <OptionCard key={o.value} label={o.label} selected={value === o.value} onClick={() => onChange(o.value)} />
      ))}
    </div>
  );
}

function MultiSelect({ value, onChange, options }: { value: string[]; onChange: (v: string[]) => void; options: Opt[] }) {
  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Select all that apply</p>
      {options.map((o) => (
        <OptionCard key={o.value} multi label={o.label} selected={value.includes(o.value)} onClick={() => toggle(o.value)} />
      ))}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-3">
      <p className="text-base font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
        {label}
        {required && <span className="ml-1" style={{ color: "var(--brand-red)" }}>*</span>}
      </p>
      {children}
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="card p-5 text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)", background: "var(--surface-2)" }}>
      {children}
    </div>
  );
}

// Page transition: slides forward or back depending on direction.
const pageVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
};

// ---------------------------------------------------------------------------

export default function SurveyWizard({ token, personal }: { token: string; personal: boolean }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [arm, setArm] = useState<"A" | "B" | null>(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);

  const [s1, setS1] = useState<AnyRec>({ role: "", sector: "", orgSize: "", hireVolume: "", intakeTrend: "", aiMaturity: "", formalTraining: "" });
  const [s2, setS2] = useState<AnyRec>({});
  const [s3a, setS3a] = useState<AnyRec>({});
  const [s3bPicks, setS3bPicks] = useState<Record<number, { best: string; worst: string }>>({});
  const [hardestToAssess, setHardestToAssess] = useState<string[]>([]);
  const [framingChanged, setFramingChanged] = useState("");
  const [s4, setS4] = useState<AnyRec>({ choice: "", wouldRead: "" });
  const [s5, setS5] = useState<AnyRec>({ stage: [], format: [], owner: "" });
  const [s6, setS6] = useState<AnyRec>({ capability: [], measure: [] });
  const [s7, setS7] = useState<AnyRec>({ email: "" });

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(token));
    const cached = raw ? JSON.parse(raw) : null;
    fetch("/api/survey/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cached?.id, token }),
    })
      .then((r) => r.json())
      .then((body) => {
        if (!body.ok) { setError(body.error ?? "Could not start survey"); return; }
        setId(body.id);
        setArm(body.arm);
        localStorage.setItem(storageKey(token), JSON.stringify({ id: body.id }));
      })
      .catch(() => setError("Could not reach the server"));
  }, [token]);

  const maxDiffSets: MaxDiffSet[] = useMemo(() => (id ? buildMaxDiffSets(id) : []), [id]);

  async function saveSection(section: string, data: unknown) {
    if (!id) return;
    setSaving(true);
    await fetch("/api/survey/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, section, data }),
    });
    setSaving(false);
  }

  const isLdOrHrbp = s1.role === "ld" || s1.role === "hrbp";

  const steps = useMemo(() => {
    const list: { key: string; title: string; required: boolean }[] = [
      { key: "intro", title: "About this survey", required: false },
      { key: "s1", title: "About you and your team", required: true },
      { key: "s2", title: "Recent experience", required: false },
    ];
    if (arm === "B") list.push({ key: "s3a", title: "A distinction some people draw", required: false });
    list.push({ key: "s3b", title: "What matters most in a new hire", required: true });
    list.push({ key: "s4", title: "Two candidates", required: true });
    list.push({ key: "s5", title: "Where this would be used", required: false });
    list.push({ key: "s6", title: "Your organisation's AI capability", required: false });
    list.push({ key: "s7", title: "Last few things", required: false });
    return list;
  }, [arm]);

  const current = steps[step];

  function maxDiffComplete() {
    return maxDiffSets.every((set) => {
      const p = s3bPicks[set.setIndex];
      return p && p.best && p.worst && p.best !== p.worst;
    });
  }

  // Why a required section can't be accepted yet, or null when it's complete.
  function sectionError(key: string): string | null {
    if (key === "s1") {
      if (!s1.role || !s1.sector || !s1.orgSize || !s1.hireVolume || !s1.intakeTrend || !s1.aiMaturity || !s1.formalTraining) {
        return "Please answer every question in this section before continuing.";
      }
    }
    if (key === "s3b") {
      if (!maxDiffComplete()) return "Please pick a most-important and least-important item in every set.";
      if (!hardestToAssess.length) return "Please choose at least one item that is hard to assess.";
      if (arm === "B" && !framingChanged) return "Please answer whether the distinction changed your answers.";
    }
    if (key === "s4") {
      if (!s4.choice) return "Please choose a candidate.";
      if (!s4.wouldRead) return "Please answer whether you'd read the record.";
    }
    return null;
  }

  function canProceed(): boolean {
    const message = sectionError(current.key);
    setError(message);
    return !message;
  }

  async function saveStep(key: string) {
    if (key === "s1") await saveSection("section1", s1);
    if (key === "s2") await saveSection("section2", s2);
    if (key === "s3a") await saveSection("section3a", s3a);
    if (key === "s3b") {
      const maxDiffPicks = maxDiffSets.map((set) => ({
        setIndex: set.setIndex,
        itemCodes: set.items.map((i) => i.code),
        best: s3bPicks[set.setIndex]?.best ?? "",
        worst: s3bPicks[set.setIndex]?.worst ?? "",
      }));
      await saveSection("section3b", { maxDiffPicks, hardestToAssess, framingChanged: arm === "B" ? framingChanged : null });
    }
    if (key === "s4") await saveSection("section4", s4);
    if (key === "s5") await saveSection("section5", s5);
    if (key === "s6") await saveSection("section6", s6);
    if (key === "s7") await saveSection("section7", s7);
  }

  const saveCurrent = () => saveStep(current.key);

  async function finishSurvey() {
    setSaving(true);
    const res = await fetch("/api/survey/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!body.ok) { setError("Could not submit — please try again."); return; }
    localStorage.removeItem(storageKey(token));
    document.cookie = `${submittedCookieName(token)}=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    // replace, not push, so Back doesn't return to the filled-in form.
    router.replace("/s/thank-you");
  }

  function moveTo(nextStep: number) {
    const target = Math.max(0, Math.min(nextStep, steps.length - 1));
    setDirection(target >= step ? 1 : -1);
    setConfirmingSubmit(false);
    setNotice(null);
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function goNext() {
    if (!canProceed()) return;
    await saveCurrent();
    if (current.key === "s7") { await finishSurvey(); return; }
    moveTo(step + 1);
  }

  // Submit from any page: required sections still have to be answered, so send
  // the respondent to the first one that isn't; otherwise confirm, then finish
  // and skip whatever optional questions are left.
  async function submitNow() {
    if (!canProceed()) return;
    const missing = steps.findIndex((s) => s.required && sectionError(s.key));
    if (missing !== -1) {
      await saveCurrent();
      moveTo(missing);
      setNotice("Almost there — please answer this section before submitting. It's one of three required ones.");
      return;
    }
    if (!confirmingSubmit) { setConfirmingSubmit(true); return; }
    // Save this page plus every required section, in case one was filled in
    // and then left with Back rather than Next.
    for (const key of new Set([current.key, ...steps.filter((s) => s.required).map((s) => s.key)])) await saveStep(key);
    await finishSurvey();
  }

  function goBack() {
    setError(null);
    moveTo(step - 1);
  }

  if (error && !id) {
    return (
      <main className="brand-backdrop flex min-h-screen items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card max-w-md p-8 text-center" style={{ boxShadow: "var(--shadow-lg)" }}>
          <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>We couldn&apos;t open the survey</p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{error}</p>
        </motion.div>
      </main>
    );
  }

  if (!id) {
    return (
      <main className="brand-backdrop flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <motion.div animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
          <BrandWordmark />
        </motion.div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      </main>
    );
  }

  const progress = (step + 1) / steps.length;
  const uniqueCards = Array.from(new Map(maxDiffSets.flatMap((s) => s.items).map((i) => [i.code, i])).values());

  return (
    <div className="brand-backdrop min-h-screen">
      <header className="sticky top-0 z-20 border-b backdrop-blur-xl" style={{ background: "var(--glass)", borderColor: "var(--gridline)" }}>
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <BrandWordmark subtitle="Industry survey" />
          <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
            Step {step + 1} of {steps.length}
          </span>
        </div>
        <div className="h-1 w-full" style={{ background: "var(--gridline)" }}>
          <motion.div
            className="h-full rounded-r-full"
            style={{ background: "linear-gradient(90deg, var(--accent), var(--brand-green))" }}
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 pt-8 pb-32">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.section
            key={current.key}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: EASE_OUT }}
            className="flex flex-col gap-7"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="eyebrow">{current.key === "intro" ? "Welcome" : `Section ${step} of ${steps.length - 1}`}</span>
                {current.required && (
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    Required
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>{current.title}</h1>
            </div>

            <AnimatePresence>
              {notice && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--brand-orange)", background: "color-mix(in srgb, var(--brand-orange) 10%, var(--surface))", color: "var(--text-primary)" }}
                >
                  {notice}
                </motion.p>
              )}
            </AnimatePresence>

            {current.key === "intro" && (
              <div className="flex flex-col gap-6">
                <p className="text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  A short survey for people who hire, manage or develop early-career talent, about how you value AI-related judgement and skills in new hires.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Clock, title: "8–10 minutes", body: "Seven short sections" },
                    { icon: ShieldCheck, title: personal ? "Confidential" : "Anonymous", body: personal ? "Seen only by the research team" : "No name needed" },
                    { icon: ListChecks, title: "Mostly optional", body: "Only three sections are required" },
                  ].map(({ icon: Icon, title, body }, i) => (
                    <motion.div
                      key={title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: EASE_OUT }}
                      className="card flex flex-col gap-2 p-4"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                        <Icon size={18} />
                      </span>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{title}</span>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{body}</span>
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {personal
                    ? "This is a personal link, so we'll know you've taken part. Your answers are kept confidential and only seen by the research team."
                    : "Your answers are anonymous."}{" "}
                  Only a few questions are required — the rest you can skip if you&apos;d rather not answer.
                </p>
              </div>
            )}

            {current.key === "s1" && (
              <div className="flex flex-col gap-8">
                <Field label="Which best describes your role?" required>
                  <SingleSelect value={s1.role as string} onChange={(v) => setS1((prev) => ({ ...prev, role: v }))} options={ROLE_OPTIONS} />
                </Field>
                <Field label="What sector?" required>
                  <SingleSelect value={s1.sector as string} onChange={(v) => setS1((prev) => ({ ...prev, sector: v }))} options={SECTOR_OPTIONS} />
                </Field>
                <Field label="How many people in your organisation?" required>
                  <SingleSelect value={s1.orgSize as string} onChange={(v) => setS1((prev) => ({ ...prev, orgSize: v }))} options={ORG_SIZE_OPTIONS} />
                </Field>
                <Field label="Early-career hires (0–2 years) taken on in the last 12 months" required>
                  <SingleSelect value={s1.hireVolume as string} onChange={(v) => setS1((prev) => ({ ...prev, hireVolume: v }))} options={HIRE_VOLUME_OPTIONS} />
                </Field>
                <Field label="Compared with two years ago, your early-career intake is" required>
                  <SingleSelect value={s1.intakeTrend as string} onChange={(v) => setS1((prev) => ({ ...prev, intakeTrend: v }))} options={INTAKE_TREND_OPTIONS} />
                </Field>
                <Field label="Share of your team using AI beyond a chat window (retrieval, agents, connected tools, evals)" required>
                  <SingleSelect value={s1.aiMaturity as string} onChange={(v) => setS1((prev) => ({ ...prev, aiMaturity: v }))} options={AI_MATURITY_OPTIONS} />
                </Field>
                <Field label="Does your organisation run formal AI training or certification?" required>
                  <SingleSelect value={s1.formalTraining as string} onChange={(v) => setS1((prev) => ({ ...prev, formalTraining: v }))} options={FORMAL_TRAINING_OPTIONS} />
                </Field>
              </div>
            )}

            {current.key === "s2" && (
              <div className="flex flex-col gap-8">
                <Field label="Has a junior employee ever submitted AI work that was wrong or unchecked, and your team failed to catch the mistake before it went too far?">
                  <SingleSelect value={(s2.gotThroughUnprompted as string) ?? ""} onChange={(v) => setS2((prev) => ({ ...prev, gotThroughUnprompted: v }))} options={SLIPPED_2_1_OPTIONS} />
                </Field>
                <Field label="In one or two sentences: what let it through?">
                  <textarea className="input" rows={3} value={(s2.whatLetItThrough as string) ?? ""} onChange={(e) => setS2((prev) => ({ ...prev, whatLetItThrough: e.target.value }))} />
                </Field>
                <Field label="When you assess an early-career candidate, are they allowed to use AI?">
                  <SingleSelect value={(s2.assessAiUse as string) ?? ""} onChange={(v) => setS2((prev) => ({ ...prev, assessAiUse: v }))} options={ASSESS_AI_USE_OPTIONS} />
                </Field>
                <AnimatePresence>
                  {s2.assessAiUse === "yes_watch" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <Field label="What are you watching for?">
                        <textarea className="input" rows={3} value={(s2.whatWatchingFor as string) ?? ""} onChange={(e) => setS2((prev) => ({ ...prev, whatWatchingFor: e.target.value }))} />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {current.key === "s3a" && (
              <div className="flex flex-col gap-8">
                <p className="text-[15px]" style={{ color: "var(--text-secondary)" }}>Some people split working with AI into two categories.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="card p-5">
                    <p className="font-semibold" style={{ color: "var(--series-skill)" }}>AI skills</p>
                    <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      Operating the tools. Prompting well, knowing which assistant to use, setting up retrieval over your own documents, building agents.
                    </p>
                  </div>
                  <div className="card p-5">
                    <p className="font-semibold" style={{ color: "var(--series-cognition)" }}>AI cognition</p>
                    <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      How a person thinks around the tool. Framing the problem before delegating, judging what to hand over, interrogating what comes back, noticing when the model is confirming their own mistake, and being able to defend the result as their own decision.
                    </p>
                  </div>
                </div>
                <Field label="Does that distinction match how you think about it?">
                  <SingleSelect value={(s3a.distinctionMatch as string) ?? ""} onChange={(v) => setS3a((prev) => ({ ...prev, distinctionMatch: v }))} options={DISTINCTION_MATCH_OPTIONS} />
                </Field>
                <AnimatePresence>
                  {(s3a.distinctionMatch === "not_really" || s3a.distinctionMatch === "no_cut_differently") && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <Field label="How would you cut it?">
                        <textarea className="input" rows={2} value={(s3a.howCutDifferently as string) ?? ""} onChange={(e) => setS3a((prev) => ({ ...prev, howCutDifferently: e.target.value }))} />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {current.key === "s3b" && (
              <div className="flex flex-col gap-8">
                <Callout>
                  Below are things an early-career hire might be good at. In each set, pick the{" "}
                  <strong style={{ color: "var(--text-primary)" }}>one that matters most</strong> and the{" "}
                  <strong style={{ color: "var(--text-primary)" }}>one that matters least</strong> for someone joining your team.
                </Callout>
                {maxDiffSets.map((set) => {
                  const pick = s3bPicks[set.setIndex] ?? { best: "", worst: "" };
                  const done = pick.best && pick.worst;
                  return (
                    <div key={set.setIndex} className="card overflow-hidden">
                      <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "var(--gridline)" }}>
                        <span className="eyebrow">Set {set.setIndex + 1} of {maxDiffSets.length}</span>
                        <AnimatePresence>
                          {done && (
                            <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={SPRING}
                              className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--status-good)" }}>
                              <Check size={14} strokeWidth={3} color="#fff" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <ul>
                        {set.items.map((item) => {
                          const isBest = pick.best === item.code;
                          const isWorst = pick.worst === item.code;
                          return (
                            <li key={item.code} className="flex flex-col gap-3 border-b px-5 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--gridline)" }}>
                              <span className="text-[15px]" style={{ color: "var(--text-primary)" }}>{item.text}</span>
                              <div className="flex shrink-0 gap-2">
                                {(["best", "worst"] as const).map((kind) => {
                                  const active = kind === "best" ? isBest : isWorst;
                                  const color = kind === "best" ? "var(--accent)" : "var(--brand-orange)";
                                  return (
                                    <button
                                      key={kind}
                                      type="button"
                                      aria-pressed={active}
                                      aria-label={`${kind === "best" ? "Most" : "Least"} important: ${item.text}`}
                                      onClick={() =>
                                        setS3bPicks((prev) => {
                                          const p = prev[set.setIndex] ?? { best: "", worst: "" };
                                          return {
                                            ...prev,
                                            [set.setIndex]:
                                              kind === "best"
                                                ? { ...p, best: item.code, worst: p.worst === item.code ? "" : p.worst }
                                                : { ...p, worst: item.code, best: p.best === item.code ? "" : p.best },
                                          };
                                        })
                                      }
                                      className="relative rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors"
                                      style={{ borderColor: active ? color : "var(--gridline)", color: active ? "#fff" : "var(--text-secondary)" }}
                                    >
                                      {active && (
                                        <motion.span layoutId={`${kind}-${set.setIndex}`} className="absolute inset-0 rounded-full" style={{ background: color }} transition={SPRING} />
                                      )}
                                      <span className="relative">{kind === "best" ? "Most" : "Least"}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
                <Field label={`Which of them are hardest to assess in your hiring process today? (max of ${MAX_HARDEST_TO_ASSESS})`} required>
                  <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pick up to {MAX_HARDEST_TO_ASSESS}</p>
                    <span className="text-xs font-semibold tabular-nums" style={{ color: hardestToAssess.length ? "var(--accent)" : "var(--text-muted)" }}>
                      {hardestToAssess.length} of {MAX_HARDEST_TO_ASSESS} selected
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {uniqueCards.map((i) => {
                      const checked = hardestToAssess.includes(i.code);
                      return (
                        <OptionCard
                          key={i.code}
                          multi
                          label={i.text}
                          selected={checked}
                          disabled={!checked && hardestToAssess.length >= MAX_HARDEST_TO_ASSESS}
                          onClick={() =>
                            setHardestToAssess((prev) =>
                              prev.includes(i.code) ? prev.filter((c) => c !== i.code) : prev.length >= MAX_HARDEST_TO_ASSESS ? prev : [...prev, i.code]
                            )
                          }
                        />
                      );
                    })}
                  </div>
                </Field>
                {arm === "B" && (
                  <Field label="Having seen the skills/cognition distinction earlier, did it change how you answered these?" required>
                    <SingleSelect value={framingChanged} onChange={setFramingChanged} options={FRAMING_CHANGED_OPTIONS} />
                  </Field>
                )}
              </div>
            )}

            {current.key === "s4" && (
              <div className="flex flex-col gap-8">
                <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Two candidates for the same junior role. Same degree, same college, same CGPA. Both submit a piece of work, and the final outputs are about equal in quality.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="card p-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}><FileText size={18} /></span>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Candidate A</span>
                    </div>
                    <p className="mt-3 text-[15px]" style={{ color: "var(--text-secondary)" }}>Submits the finished work.</p>
                  </div>
                  <div className="card p-5" style={{ borderColor: "color-mix(in srgb, var(--accent) 40%, var(--gridline))" }}>
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}><NotebookPen size={18} /></span>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Candidate B</span>
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      Submits the same work plus a two-page record: how they re-scoped the brief, which parts they gave to AI and which they did themselves and why, three places where they rejected or rewrote what the model returned — including one where it had agreed with a mistake they&apos;d already made — and what they&apos;d still want checked by someone senior.
                    </p>
                  </div>
                </div>
                <Field label="Which one gets the interview?" required>
                  <SingleSelect value={s4.choice as string} onChange={(v) => setS4((prev) => ({ ...prev, choice: v }))} options={VIGNETTE_CHOICE_OPTIONS} />
                </Field>
                <Field label="Would you actually read Candidate B's record?" required>
                  <SingleSelect value={s4.wouldRead as string} onChange={(v) => setS4((prev) => ({ ...prev, wouldRead: v }))} options={WOULD_READ_OPTIONS} />
                </Field>
              </div>
            )}

            {current.key === "s5" && (
              <div className="flex flex-col gap-8">
                <Field label="At which stage would a record like Candidate B's realistically be used?">
                  <MultiSelect value={s5.stage as string[]} onChange={(v) => setS5((prev) => ({ ...prev, stage: v }))} options={STAGE_OPTIONS} />
                </Field>
                <Field label="In what form would it have to arrive to be usable?">
                  <MultiSelect value={s5.format as string[]} onChange={(v) => setS5((prev) => ({ ...prev, format: v }))} options={FORMAT_OPTIONS} />
                </Field>
                <Field label="Who decides whether a new candidate signal enters your hiring process?">
                  <SingleSelect value={s5.owner as string} onChange={(v) => setS5((prev) => ({ ...prev, owner: v }))} options={OWNER_OPTIONS} />
                </Field>
                <Field label="If a college told you their graduates arrive with assessed evidence of this, what's the first question you'd ask them?">
                  <textarea className="input" rows={3} value={(s5.firstQuestion as string) ?? ""} onChange={(e) => setS5((prev) => ({ ...prev, firstQuestion: e.target.value }))} />
                </Field>
              </div>
            )}

            {current.key === "s6" && (
              <div className="flex flex-col gap-8">
                <Field label="What is your organisation doing on AI capability for its own people?">
                  <MultiSelect value={s6.capability as string[]} onChange={(v) => setS6((prev) => ({ ...prev, capability: v }))} options={ORG_AI_CAPABILITY_OPTIONS} />
                </Field>
                {isLdOrHrbp && (
                  <Field label="What do you measure about it?">
                    <MultiSelect value={s6.measure as string[]} onChange={(v) => setS6((prev) => ({ ...prev, measure: v }))} options={ORG_AI_MEASURE_OPTIONS} />
                  </Field>
                )}
                {isLdOrHrbp && (
                  <Field label="Of the people who completed AI training, roughly what share changed how they actually work?">
                    <SingleSelect value={(s6.shareChanged as string) ?? ""} onChange={(v) => setS6((prev) => ({ ...prev, shareChanged: v }))} options={SHARE_CHANGED_OPTIONS} />
                  </Field>
                )}
                <Field label="Has AI skilling translated into measurable efficiency in your organisation?">
                  <SingleSelect value={(s6.efficiency as string) ?? ""} onChange={(v) => setS6((prev) => ({ ...prev, efficiency: v }))} options={EFFICIENCY_OPTIONS} />
                </Field>
                {isLdOrHrbp && (
                  <Field label="Does your organisation distinguish between training people to use AI and training people to think alongside it?">
                    <SingleSelect value={(s6.distinguish as string) ?? ""} onChange={(v) => setS6((prev) => ({ ...prev, distinguish: v }))} options={DISTINGUISH_OPTIONS} />
                  </Field>
                )}
                {isLdOrHrbp && (
                  <Field label="If you could measure one thing about AI capability in your team that you can't measure today, what would it be?">
                    <textarea className="input" rows={3} value={(s6.oneThingToMeasure as string) ?? ""} onChange={(e) => setS6((prev) => ({ ...prev, oneThingToMeasure: e.target.value }))} />
                  </Field>
                )}
              </div>
            )}

            {current.key === "s7" && (
              <div className="flex flex-col gap-8">
                <Field label="Anything about early-career hiring and AI that this survey didn't ask about and should have?">
                  <textarea className="input" rows={3} value={(s7.missedAnything as string) ?? ""} onChange={(e) => setS7((prev) => ({ ...prev, missedAnything: e.target.value }))} />
                </Field>
                <Field label="Would you be willing to look at anonymised student work and score it against the criteria you've described here — twenty minutes, twice, three months apart?">
                  <SingleSelect value={(s7.panelWillingness as string) ?? ""} onChange={(v) => setS7((prev) => ({ ...prev, panelWillingness: v }))} options={PANEL_WILLINGNESS_OPTIONS} />
                </Field>
                <Field label="Email, if you'd like the anonymised findings">
                  <input type="email" className="input" placeholder="you@company.com" value={(s7.email as string) ?? ""} onChange={(e) => setS7((prev) => ({ ...prev, email: e.target.value }))} />
                </Field>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </main>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur-xl" style={{ background: "var(--glass)", borderColor: "var(--gridline)" }}>
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-5 py-3">
          <AnimatePresence>
            {error && (
              <motion.p key="error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="text-sm font-medium" style={{ color: "var(--status-critical)" }}>
                {error}
              </motion.p>
            )}
            {confirmingSubmit && (
              <motion.div key="confirm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--accent)", boxShadow: "var(--shadow-md)" }}>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  Submit your survey now? Any remaining optional questions will be skipped, and you won&apos;t be able to change your answers afterwards.
                </p>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => setConfirmingSubmit(false)} className="btn btn-secondary">Keep going</button>
                  <button type="button" onClick={submitNow} disabled={saving} className="btn btn-primary">{saving ? "Submitting…" : "Yes, submit"}</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={goBack} disabled={step === 0} className="btn btn-ghost px-3">
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="flex items-center gap-2">
              {current.key !== "s7" && !confirmingSubmit && (
                <button type="button" onClick={submitNow} disabled={saving} className="btn btn-secondary">
                  <Send size={15} />
                  <span className="hidden sm:inline">Submit survey</span>
                  <span className="sm:hidden">Submit</span>
                </button>
              )}
              <motion.button type="button" onClick={goNext} disabled={saving} whileTap={{ scale: 0.97 }} className="btn btn-primary group min-w-[7rem]">
                {current.key === "s7" ? (
                  <>
                    <Sparkles size={16} />
                    {saving ? "Submitting…" : "Submit"}
                  </>
                ) : (
                  <>
                    {saving ? "Saving…" : current.key === "intro" ? "Start" : "Next"}
                    {!saving && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
