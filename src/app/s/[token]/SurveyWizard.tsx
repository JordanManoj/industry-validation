"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildMaxDiffSets, MaxDiffSet } from "@/lib/maxdiffDesign";
import {
  ROLE_OPTIONS, SECTOR_OPTIONS, ORG_SIZE_OPTIONS, HIRE_VOLUME_OPTIONS, INTAKE_TREND_OPTIONS,
  AI_MATURITY_OPTIONS, FORMAL_TRAINING_OPTIONS, SLIPPED_2_1_OPTIONS, ASSESS_AI_USE_OPTIONS,
  DISTINCTION_MATCH_OPTIONS, FRAMING_CHANGED_OPTIONS, VIGNETTE_CHOICE_OPTIONS, WOULD_READ_OPTIONS,
  CONSTANT_SUM_CATEGORIES, DISTRUST_OPTIONS, STAGE_OPTIONS, FORMAT_OPTIONS, OWNER_OPTIONS,
  ORG_AI_CAPABILITY_OPTIONS, ORG_AI_MEASURE_OPTIONS, SHARE_CHANGED_OPTIONS, EFFICIENCY_OPTIONS,
  DISTINGUISH_OPTIONS, PANEL_WILLINGNESS_OPTIONS, Opt,
} from "@/lib/surveyOptions";

const inputStyle = { background: "var(--surface)", borderColor: "var(--gridline)", color: "var(--text-primary)" } as const;
const fieldCls = "rounded-md border px-3 py-2 text-sm w-full";

function storageKey(token: string) {
  return `iv_survey_${token}`;
}

type AnyRec = Record<string, unknown>;

function SingleSelect({ value, onChange, options, required }: { value: string; onChange: (v: string) => void; options: Opt[]; required?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: value === o.value ? "var(--series-cognition)" : "var(--gridline)", background: "var(--surface)" }}>
          <input type="radio" name={o.value + Math.random()} checked={value === o.value} onChange={() => onChange(o.value)} required={required} />
          <span style={{ color: "var(--text-primary)" }}>{o.label}</span>
        </label>
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
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: value.includes(o.value) ? "var(--series-cognition)" : "var(--gridline)", background: "var(--surface)" }}>
          <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
          <span style={{ color: "var(--text-primary)" }}>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {label}{required && <span style={{ color: "var(--status-critical)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function SurveyWizard({ token }: { token: string }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [arm, setArm] = useState<"A" | "B" | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [s1, setS1] = useState<AnyRec>({ role: "", sector: "", orgSize: "", hireVolume: "", intakeTrend: "", aiMaturity: "", formalTraining: "" });
  const [s2, setS2] = useState<AnyRec>({});
  const [s3a, setS3a] = useState<AnyRec>({});
  const [s3bPicks, setS3bPicks] = useState<Record<number, { best: string; worst: string }>>({});
  const [hardestToAssess, setHardestToAssess] = useState("");
  const [framingChanged, setFramingChanged] = useState("");
  const [s4, setS4] = useState<AnyRec>({ choice: "", wouldRead: "", constantSum: { faster_interview: 0, higher_band: 0, shorter_ramp: 0, more_autonomy: 0, nothing: 0 }, distrust: [] });
  const [s5, setS5] = useState<AnyRec>({ stage: [], format: [], owner: "", attentionCheck: "" });
  const [s6, setS6] = useState<AnyRec>({ capability: [], measure: [] });
  const [s7, setS7] = useState<AnyRec>({ email: "" });

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(token));
    const cached = raw ? JSON.parse(raw) : null;
    fetch("/api/survey/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cached?.id }),
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

  function constantSumTotal() {
    const cs = s4.constantSum as Record<string, number>;
    return Object.values(cs).reduce((a, b) => a + (Number(b) || 0), 0);
  }

  function maxDiffComplete() {
    return maxDiffSets.every((set) => {
      const p = s3bPicks[set.setIndex];
      return p && p.best && p.worst && p.best !== p.worst;
    });
  }

  function canProceed(): boolean {
    setError(null);
    if (current.key === "s1") {
      if (!s1.role || !s1.sector || !s1.orgSize || !s1.hireVolume || !s1.intakeTrend || !s1.aiMaturity || !s1.formalTraining) {
        setError("Please answer every question in this section before continuing.");
        return false;
      }
    }
    if (current.key === "s3b") {
      if (!maxDiffComplete()) { setError("Please pick a most-important and least-important item in every set."); return false; }
      if (!hardestToAssess) { setError("Please choose which item is hardest to assess."); return false; }
      if (arm === "B" && !framingChanged) { setError("Please answer whether the distinction changed your answers."); return false; }
    }
    if (current.key === "s4") {
      if (!s4.choice) { setError("Please choose a candidate."); return false; }
      if (!s4.wouldRead) { setError("Please answer whether you'd read the record."); return false; }
      if (constantSumTotal() !== 100) { setError(`Your five points must add up to exactly 100 (currently ${constantSumTotal()}).`); return false; }
      if (!(s4.distrust as string[])?.length) { setError("Please select at least one option."); return false; }
    }
    return true;
  }

  async function goNext() {
    if (!canProceed()) return;
    if (current.key === "s1") await saveSection("section1", s1);
    if (current.key === "s2") await saveSection("section2", s2);
    if (current.key === "s3a") await saveSection("section3a", s3a);
    if (current.key === "s3b") {
      const maxDiffPicks = maxDiffSets.map((set) => ({
        setIndex: set.setIndex,
        itemCodes: set.items.map((i) => i.code),
        best: s3bPicks[set.setIndex]?.best ?? "",
        worst: s3bPicks[set.setIndex]?.worst ?? "",
      }));
      await saveSection("section3b", { maxDiffPicks, hardestToAssess, framingChanged: arm === "B" ? framingChanged : null });
    }
    if (current.key === "s4") await saveSection("section4", s4);
    if (current.key === "s5") await saveSection("section5", s5);
    if (current.key === "s6") await saveSection("section6", s6);
    if (current.key === "s7") {
      await saveSection("section7", s7);
      const res = await fetch("/api/survey/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!body.ok) { setError("Could not submit — please try again."); return; }
      localStorage.removeItem(storageKey(token));
      router.push("/s/thank-you");
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  if (error && !id) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p style={{ color: "var(--status-critical)" }}>{error}</p>
      </main>
    );
  }

  if (!id) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-10">
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--gridline)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%`, background: "var(--series-cognition)" }} />
      </div>

      <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{current.title}</h1>

      <div className="flex flex-col gap-6">
        {current.key === "intro" && (
          <div className="flex flex-col gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            <p>This is a short survey (8–10 minutes) for people who hire, manage or develop early-career talent, about how you value AI-related judgement and skills in new hires.</p>
            <p>Your answers are anonymous. Only a few questions are required — the rest you can skip if you&apos;d rather not answer.</p>
          </div>
        )}

        {current.key === "s1" && (
          <div className="flex flex-col gap-5">
            <Field label="Which best describes your role?" required>
              <SingleSelect value={s1.role as string} onChange={(v) => setS1({ ...s1, role: v })} options={ROLE_OPTIONS} />
            </Field>
            <Field label="What sector?" required>
              <SingleSelect value={s1.sector as string} onChange={(v) => setS1({ ...s1, sector: v })} options={SECTOR_OPTIONS} />
            </Field>
            <Field label="How many people in your organisation?" required>
              <SingleSelect value={s1.orgSize as string} onChange={(v) => setS1({ ...s1, orgSize: v })} options={ORG_SIZE_OPTIONS} />
            </Field>
            <Field label="Early-career hires (0–2 years) taken on in the last 12 months" required>
              <SingleSelect value={s1.hireVolume as string} onChange={(v) => setS1({ ...s1, hireVolume: v })} options={HIRE_VOLUME_OPTIONS} />
            </Field>
            <Field label="Compared with two years ago, your early-career intake is" required>
              <SingleSelect value={s1.intakeTrend as string} onChange={(v) => setS1({ ...s1, intakeTrend: v })} options={INTAKE_TREND_OPTIONS} />
            </Field>
            <Field label="Share of your team using AI beyond a chat window (retrieval, agents, connected tools, evals)" required>
              <SingleSelect value={s1.aiMaturity as string} onChange={(v) => setS1({ ...s1, aiMaturity: v })} options={AI_MATURITY_OPTIONS} />
            </Field>
            <Field label="Does your organisation run formal AI training or certification?" required>
              <SingleSelect value={s1.formalTraining as string} onChange={(v) => setS1({ ...s1, formalTraining: v })} options={FORMAL_TRAINING_OPTIONS} />
            </Field>
          </div>
        )}

        {current.key === "s2" && (
          <div className="flex flex-col gap-5">
            <Field label="In the last 12 months, has AI-generated work from an early-career team member got further through your process than it should have?">
              <SingleSelect value={s2.gotThroughUnprompted as string ?? ""} onChange={(v) => setS2({ ...s2, gotThroughUnprompted: v })} options={SLIPPED_2_1_OPTIONS} />
            </Field>
            <Field label="In one or two sentences: what let it through?">
              <textarea className={fieldCls} style={inputStyle} rows={3} value={s2.whatLetItThrough as string ?? ""} onChange={(e) => setS2({ ...s2, whatLetItThrough: e.target.value })} />
            </Field>
            <Field label="When you assess an early-career candidate, are they allowed to use AI?">
              <SingleSelect value={s2.assessAiUse as string ?? ""} onChange={(v) => setS2({ ...s2, assessAiUse: v })} options={ASSESS_AI_USE_OPTIONS} />
            </Field>
            {s2.assessAiUse === "yes_watch" && (
              <Field label="What are you watching for?">
                <textarea className={fieldCls} style={inputStyle} rows={3} value={s2.whatWatchingFor as string ?? ""} onChange={(e) => setS2({ ...s2, whatWatchingFor: e.target.value })} />
              </Field>
            )}
          </div>
        )}

        {current.key === "s3a" && (
          <div className="flex flex-col gap-5">
            <div className="rounded-md border p-4 text-sm" style={{ background: "var(--surface)", borderColor: "var(--gridline)", color: "var(--text-secondary)" }}>
              <p>Some people split working with AI into two categories.</p>
              <p className="mt-2"><strong style={{ color: "var(--text-primary)" }}>AI skills</strong> — operating the tools. Prompting well, knowing which assistant to use, setting up retrieval over your own documents, building agents.</p>
              <p className="mt-2"><strong style={{ color: "var(--text-primary)" }}>AI cognition</strong> — how a person thinks around the tool. Framing the problem before delegating, judging what to hand over, interrogating what comes back, noticing when the model is confirming their own mistake, and being able to defend the result as their own decision.</p>
            </div>
            <Field label="Does that distinction match how you think about it?">
              <SingleSelect value={s3a.distinctionMatch as string ?? ""} onChange={(v) => setS3a({ ...s3a, distinctionMatch: v })} options={DISTINCTION_MATCH_OPTIONS} />
            </Field>
            {(s3a.distinctionMatch === "not_really" || s3a.distinctionMatch === "no_cut_differently") && (
              <Field label="How would you cut it?">
                <textarea className={fieldCls} style={inputStyle} rows={2} value={s3a.howCutDifferently as string ?? ""} onChange={(e) => setS3a({ ...s3a, howCutDifferently: e.target.value })} />
              </Field>
            )}
          </div>
        )}

        {current.key === "s3b" && (
          <div className="flex flex-col gap-8">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Below are things an early-career hire might be good at. In each set, pick the <strong>one that matters most</strong> and the <strong>one that matters least</strong> for someone joining your team.
            </p>
            {maxDiffSets.map((set) => {
              const pick = s3bPicks[set.setIndex] ?? { best: "", worst: "" };
              return (
                <div key={set.setIndex} className="rounded-md border p-4" style={{ borderColor: "var(--gridline)" }}>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Set {set.setIndex + 1} of {maxDiffSets.length}</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: "var(--text-muted)" }}>
                        <th className="text-left font-normal">Item</th>
                        <th className="w-16 text-center font-normal">Most</th>
                        <th className="w-16 text-center font-normal">Least</th>
                      </tr>
                    </thead>
                    <tbody>
                      {set.items.map((item) => (
                        <tr key={item.code} className="border-t" style={{ borderColor: "var(--gridline)" }}>
                          <td className="py-2 pr-2" style={{ color: "var(--text-primary)" }}>{item.text}</td>
                          <td className="text-center">
                            <input type="radio" name={`best-${set.setIndex}`} checked={pick.best === item.code} onChange={() => setS3bPicks({ ...s3bPicks, [set.setIndex]: { ...pick, best: item.code, worst: pick.worst === item.code ? "" : pick.worst } })} />
                          </td>
                          <td className="text-center">
                            <input type="radio" name={`worst-${set.setIndex}`} checked={pick.worst === item.code} onChange={() => setS3bPicks({ ...s3bPicks, [set.setIndex]: { ...pick, worst: item.code, best: pick.best === item.code ? "" : pick.best } })} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
            <Field label="Which one of those is hardest to assess in your hiring process today?" required>
              <select className={fieldCls} style={inputStyle} value={hardestToAssess} onChange={(e) => setHardestToAssess(e.target.value)}>
                <option value="">Choose one…</option>
                {maxDiffSets[0]?.items && Array.from(new Map(maxDiffSets.flatMap((s) => s.items).map((i) => [i.code, i])).values()).map((i) => (
                  <option key={i.code} value={i.code}>{i.text}</option>
                ))}
              </select>
            </Field>
            {arm === "B" && (
              <Field label="Having seen the skills/cognition distinction earlier, did it change how you answered these?" required>
                <SingleSelect value={framingChanged} onChange={setFramingChanged} options={FRAMING_CHANGED_OPTIONS} />
              </Field>
            )}
          </div>
        )}

        {current.key === "s4" && (
          <div className="flex flex-col gap-6">
            <div className="rounded-md border p-4 text-sm" style={{ background: "var(--surface)", borderColor: "var(--gridline)", color: "var(--text-secondary)" }}>
              <p>Two candidates for the same junior role. Same degree, same college, same CGPA. Both submit a piece of work, and the final outputs are about equal in quality.</p>
              <p className="mt-2"><strong style={{ color: "var(--text-primary)" }}>Candidate A</strong> submits the finished work.</p>
              <p className="mt-2"><strong style={{ color: "var(--text-primary)" }}>Candidate B</strong> submits the same work plus a two-page record: how they re-scoped the brief, which parts they gave to AI and which they did themselves and why, three places where they rejected or rewrote what the model returned — including one where it had agreed with a mistake they&apos;d already made — and what they&apos;d still want checked by someone senior.</p>
            </div>
            <Field label="Which one gets the interview?" required>
              <SingleSelect value={s4.choice as string} onChange={(v) => setS4({ ...s4, choice: v })} options={VIGNETTE_CHOICE_OPTIONS} />
            </Field>
            <Field label="Would you actually read Candidate B's record?" required>
              <SingleSelect value={s4.wouldRead as string} onChange={(v) => setS4({ ...s4, wouldRead: v })} options={WOULD_READ_OPTIONS} />
            </Field>
            <Field label={`If everything else were identical, what would that record be worth? Distribute 100 points across these. (Total: ${constantSumTotal()}/100)`} required>
              <div className="flex flex-col gap-2">
                {CONSTANT_SUM_CATEGORIES.map((o) => (
                  <div key={o.value} className="flex items-center gap-3">
                    <span className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{o.label}</span>
                    <input
                      type="number" min={0} max={100}
                      className="w-20 rounded-md border px-2 py-1 text-right text-sm" style={inputStyle}
                      value={(s4.constantSum as Record<string, number>)[o.value]}
                      onChange={(e) => setS4({ ...s4, constantSum: { ...(s4.constantSum as object), [o.value]: Number(e.target.value) || 0 } })}
                    />
                  </div>
                ))}
              </div>
            </Field>
            <Field label="What would make you distrust a record like that?" required>
              <MultiSelect value={s4.distrust as string[]} onChange={(v) => setS4({ ...s4, distrust: v })} options={DISTRUST_OPTIONS} />
            </Field>
          </div>
        )}

        {current.key === "s5" && (
          <div className="flex flex-col gap-5">
            <Field label="At which stage would a record like Candidate B's realistically be used?">
              <MultiSelect value={s5.stage as string[]} onChange={(v) => setS5({ ...s5, stage: v })} options={STAGE_OPTIONS} />
            </Field>
            <Field label="In what form would it have to arrive to be usable?">
              <MultiSelect value={s5.format as string[]} onChange={(v) => setS5({ ...s5, format: v })} options={FORMAT_OPTIONS} />
            </Field>
            <Field label="Who decides whether a new candidate signal enters your hiring process?">
              <SingleSelect value={s5.owner as string} onChange={(v) => setS5({ ...s5, owner: v })} options={OWNER_OPTIONS} />
            </Field>
            <Field label="Please select 'A shorter ramp-up expectation' for this item.">
              <SingleSelect value={s5.attentionCheck as string} onChange={(v) => setS5({ ...s5, attentionCheck: v })} options={CONSTANT_SUM_CATEGORIES} />
            </Field>
            <Field label="If a college told you their graduates arrive with assessed evidence of this, what's the first question you'd ask them?">
              <textarea className={fieldCls} style={inputStyle} rows={3} value={s5.firstQuestion as string ?? ""} onChange={(e) => setS5({ ...s5, firstQuestion: e.target.value })} />
            </Field>
          </div>
        )}

        {current.key === "s6" && (
          <div className="flex flex-col gap-5">
            <Field label="What is your organisation doing on AI capability for its own people?">
              <MultiSelect value={s6.capability as string[]} onChange={(v) => setS6({ ...s6, capability: v })} options={ORG_AI_CAPABILITY_OPTIONS} />
            </Field>
            {isLdOrHrbp && (
              <Field label="What do you measure about it?">
                <MultiSelect value={s6.measure as string[]} onChange={(v) => setS6({ ...s6, measure: v })} options={ORG_AI_MEASURE_OPTIONS} />
              </Field>
            )}
            {isLdOrHrbp && (
              <Field label="Of the people who completed AI training, roughly what share changed how they actually work?">
                <SingleSelect value={s6.shareChanged as string ?? ""} onChange={(v) => setS6({ ...s6, shareChanged: v })} options={SHARE_CHANGED_OPTIONS} />
              </Field>
            )}
            <Field label="Has AI skilling translated into measurable efficiency in your organisation?">
              <SingleSelect value={s6.efficiency as string ?? ""} onChange={(v) => setS6({ ...s6, efficiency: v })} options={EFFICIENCY_OPTIONS} />
            </Field>
            {isLdOrHrbp && (
              <Field label="Does your organisation distinguish between training people to use AI and training people to think alongside it?">
                <SingleSelect value={s6.distinguish as string ?? ""} onChange={(v) => setS6({ ...s6, distinguish: v })} options={DISTINGUISH_OPTIONS} />
              </Field>
            )}
            {isLdOrHrbp && (
              <Field label="If you could measure one thing about AI capability in your team that you can't measure today, what would it be?">
                <textarea className={fieldCls} style={inputStyle} rows={3} value={s6.oneThingToMeasure as string ?? ""} onChange={(e) => setS6({ ...s6, oneThingToMeasure: e.target.value })} />
              </Field>
            )}
          </div>
        )}

        {current.key === "s7" && (
          <div className="flex flex-col gap-5">
            <Field label="Anything about early-career hiring and AI that this survey didn't ask about and should have?">
              <textarea className={fieldCls} style={inputStyle} rows={3} value={s7.missedAnything as string ?? ""} onChange={(e) => setS7({ ...s7, missedAnything: e.target.value })} />
            </Field>
            <Field label="Would you be willing to look at anonymised student work and score it against the criteria you've described here — twenty minutes, twice, three months apart?">
              <SingleSelect value={s7.panelWillingness as string ?? ""} onChange={(v) => setS7({ ...s7, panelWillingness: v })} options={PANEL_WILLINGNESS_OPTIONS} />
            </Field>
            <Field label="Email, if you'd like the anonymised findings">
              <input type="email" className={fieldCls} style={inputStyle} value={s7.email as string ?? ""} onChange={(e) => setS7({ ...s7, email: e.target.value })} />
            </Field>
          </div>
        )}
      </div>

      {error && <p className="text-sm" style={{ color: "var(--status-critical)" }}>{error}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="rounded-md border px-4 py-2 text-sm disabled:opacity-40"
          style={{ borderColor: "var(--gridline)", color: "var(--text-primary)" }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={saving}
          className="rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "var(--series-cognition)" }}
        >
          {current.key === "s7" ? (saving ? "Submitting…" : "Submit") : saving ? "Saving…" : "Next"}
        </button>
      </div>
    </main>
  );
}
