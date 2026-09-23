"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONSTRUCT_DEFS, CARD_DECK, PERSONAS } from "@/lib/constructs";
import {
  HIRE_VOLUME_OPTIONS,
  AI_MATURITY_OPTIONS,
  FORMAL_TRAINING_OPTIONS,
  STAGE_OPTIONS,
  OWNER_OPTIONS,
  FORMAT_OPTIONS,
} from "@/lib/surveyOptions";

type Interview = {
  id: string; code: string; arm: string; persona: string; date: string | null;
  name: string | null; roleTitle: string | null; organisation: string | null; sector: string | null;
  hireVolumeBand: string | null; aiMaturityBand: string | null; formalTraining: string | null;
  interviewDone: boolean; panelAsk: string | null; panelCondition: string | null;
  oneSurprise: string | null; bestQuote: string | null; referrals: string | null;
};
type Tally = Record<string, boolean | string | null>;
type CardSort = Record<string, number | string | null>;
type Vignette = Record<string, string | null>;
type Verbatim = { id: string; block: string | null; constructCode: string | null; quote: string; whyItMatters: string | null };

const inputStyle = { background: "var(--surface)", borderColor: "var(--gridline)", color: "var(--text-primary)" } as const;
const fieldCls = "rounded-md border px-3 py-2 text-sm w-full";
const labelCls = "flex flex-col gap-1 text-sm";
const labelTextStyle = { color: "var(--text-secondary)" } as const;

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-4 py-1.5 text-sm font-medium text-white"
      style={{ background: saved ? "var(--status-good)" : "var(--series-cognition)" }}
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}

export default function InterviewEditor({
  data,
}: {
  data: { interview: Interview; tally: Tally | null; cardSort: CardSort | null; vignette: Vignette | null; verbatims: Verbatim[] };
}) {
  const router = useRouter();
  const [interview, setInterview] = useState(data.interview);
  const [tally, setTally] = useState<Tally>(data.tally ?? {});
  const [cardSort, setCardSort] = useState<CardSort>(data.cardSort ?? {});
  const [vignette, setVignette] = useState<Vignette>(data.vignette ?? {});
  const [verbatims, setVerbatims] = useState(data.verbatims);
  const [newVerbatim, setNewVerbatim] = useState({ block: "", constructCode: "", quote: "", whyItMatters: "" });
  const [savedFlags, setSavedFlags] = useState<Record<string, boolean>>({});

  async function save(section: string, payload: Record<string, unknown>) {
    // tally/cardSort/vignette state is seeded from the DB row, which carries
    // its own `id`/`interviewId` — strip them so the PATCH only ever touches
    // real column values, never the row's own keys.
    const { id: _id, interviewId: _interviewId, ...clean } = payload;
    void _id;
    void _interviewId;
    await fetch(`/api/admin/interviews/${interview.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [section]: clean }),
    });
    setSavedFlags((s) => ({ ...s, [section]: true }));
    setTimeout(() => setSavedFlags((s) => ({ ...s, [section]: false })), 1500);
    router.refresh();
  }

  async function addVerbatim() {
    if (!newVerbatim.quote.trim()) return;
    await fetch(`/api/admin/interviews/${interview.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newVerbatim }),
    });
    setVerbatims((v) => [{ id: crypto.randomUUID(), ...newVerbatim }, ...v]);
    setNewVerbatim({ block: "", constructCode: "", quote: "", whyItMatters: "" });
  }

  const isArmB = interview.arm === "B";

  return (
    <div className="flex max-w-4xl flex-col gap-10 pb-20">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{interview.code}</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{PERSONAS[interview.persona] ?? interview.persona} · Arm {interview.arm}</p>
      </div>

      {/* Respondent log */}
      <section className="rounded-lg border p-5" style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>1 · Respondent log</h2>
          <SaveButton saved={!!savedFlags.interview} onClick={() => save("interview", {
            name: interview.name, roleTitle: interview.roleTitle, organisation: interview.organisation, sector: interview.sector,
            hireVolumeBand: interview.hireVolumeBand, aiMaturityBand: interview.aiMaturityBand, formalTraining: interview.formalTraining,
            interviewDone: interview.interviewDone, panelAsk: interview.panelAsk, panelCondition: interview.panelCondition,
            oneSurprise: interview.oneSurprise, bestQuote: interview.bestQuote, referrals: interview.referrals,
          })} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelCls}><span style={labelTextStyle}>Name</span>
            <input className={fieldCls} style={inputStyle} value={interview.name ?? ""} onChange={(e) => setInterview({ ...interview, name: e.target.value })} />
          </label>
          <label className={labelCls}><span style={labelTextStyle}>Role title</span>
            <input className={fieldCls} style={inputStyle} value={interview.roleTitle ?? ""} onChange={(e) => setInterview({ ...interview, roleTitle: e.target.value })} />
          </label>
          <label className={labelCls}><span style={labelTextStyle}>Organisation</span>
            <input className={fieldCls} style={inputStyle} value={interview.organisation ?? ""} onChange={(e) => setInterview({ ...interview, organisation: e.target.value })} />
          </label>
          <label className={labelCls}><span style={labelTextStyle}>Sector</span>
            <input className={fieldCls} style={inputStyle} value={interview.sector ?? ""} onChange={(e) => setInterview({ ...interview, sector: e.target.value })} />
          </label>
          <label className={labelCls}><span style={labelTextStyle}>Hire volume (S-3)</span>
            <select className={fieldCls} style={inputStyle} value={interview.hireVolumeBand ?? ""} onChange={(e) => setInterview({ ...interview, hireVolumeBand: e.target.value })}>
              <option value="">—</option>
              {HIRE_VOLUME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className={labelCls}><span style={labelTextStyle}>AI maturity (S-4)</span>
            <select className={fieldCls} style={inputStyle} value={interview.aiMaturityBand ?? ""} onChange={(e) => setInterview({ ...interview, aiMaturityBand: e.target.value })}>
              <option value="">—</option>
              {AI_MATURITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className={labelCls}><span style={labelTextStyle}>Formal AI training (S-5)</span>
            <select className={fieldCls} style={inputStyle} value={interview.formalTraining ?? ""} onChange={(e) => setInterview({ ...interview, formalTraining: e.target.value })}>
              <option value="">—</option>
              {FORMAL_TRAINING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm" style={labelTextStyle}>
            <input type="checkbox" checked={interview.interviewDone} onChange={(e) => setInterview({ ...interview, interviewDone: e.target.checked })} />
            Interview done
          </label>
          <label className={labelCls}><span style={labelTextStyle}>Panel ask (7.4)</span>
            <select className={fieldCls} style={inputStyle} value={interview.panelAsk ?? ""} onChange={(e) => setInterview({ ...interview, panelAsk: e.target.value })}>
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="conditional">Conditional</option>
              <option value="maybe">Maybe</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className={labelCls}><span style={labelTextStyle}>Panel condition</span>
            <input className={fieldCls} style={inputStyle} value={interview.panelCondition ?? ""} onChange={(e) => setInterview({ ...interview, panelCondition: e.target.value })} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}><span style={labelTextStyle}>The one surprise</span>
            <textarea className={fieldCls} style={inputStyle} rows={2} value={interview.oneSurprise ?? ""} onChange={(e) => setInterview({ ...interview, oneSurprise: e.target.value })} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}><span style={labelTextStyle}>Best verbatim quote</span>
            <textarea className={fieldCls} style={inputStyle} rows={2} value={interview.bestQuote ?? ""} onChange={(e) => setInterview({ ...interview, bestQuote: e.target.value })} />
          </label>
          <label className={labelCls}><span style={labelTextStyle}>Referrals (7.3)</span>
            <input className={fieldCls} style={inputStyle} value={interview.referrals ?? ""} onChange={(e) => setInterview({ ...interview, referrals: e.target.value })} />
          </label>
        </div>
      </section>

      {/* Construct tally */}
      <section className="rounded-lg border p-5" style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>2 · Construct tally (Block 2)</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Tick only where the respondent raised it BEFORE you used the word. This is the K1 metric.
            </p>
          </div>
          <SaveButton saved={!!savedFlags.tally} onClick={() => save("tally", tally)} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CONSTRUCT_DEFS.map((c) => (
            <label key={c.code} className="flex items-start gap-2 text-sm" style={labelTextStyle} title={c.countsWhen}>
              <input
                type="checkbox"
                className="mt-0.5"
                checked={!!tally[c.code.toLowerCase()]}
                onChange={(e) => setTally({ ...tally, [c.code.toLowerCase()]: e.target.checked })}
              />
              <span><strong style={{ color: "var(--text-primary)" }}>{c.code}</strong> — {c.label}</span>
            </label>
          ))}
        </div>
        <label className={`${labelCls} mt-4`}><span style={labelTextStyle}>Other construct they raised (write in)</span>
          <input className={fieldCls} style={inputStyle} value={(tally.otherConstruct as string) ?? ""} onChange={(e) => setTally({ ...tally, otherConstruct: e.target.value })} />
        </label>
      </section>

      {/* Card sort */}
      <section className="rounded-lg border p-5" style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>3 · Card sort (Block 3)</h2>
          <SaveButton saved={!!savedFlags.cardSort} onClick={() => save("cardSort", cardSort)} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CardSlotGroup label="Top 5 (most valued)" keys={["top1", "top2", "top3", "top4", "top5"]} cardSort={cardSort} setCardSort={setCardSort} />
          <CardSlotGroup label="Bottom 3 (least valued)" keys={["bottom1", "bottom2", "bottom3"]} cardSort={cardSort} setCardSort={setCardSort} />
          {isArmB && <CardSlotGroup label="Re-sort after framing (3.6B, Arm B only)" keys={["resort1", "resort2", "resort3", "resort4", "resort5"]} cardSort={cardSort} setCardSort={setCardSort} />}
          <label className={labelCls}><span style={labelTextStyle}>3.4 Hardest to check</span>
            <CardSelect value={cardSort.hardestToCheck ?? null} onChange={(v) => setCardSort({ ...cardSort, hardestToCheck: v })} />
          </label>
        </div>
      </section>

      {/* Vignette and journey */}
      <section className="rounded-lg border p-5" style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>4–5 · Vignette and journey</h2>
          <SaveButton saved={!!savedFlags.vignette} onClick={() => save("vignette", vignette)} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelCls}><span style={labelTextStyle}>4.1 Choice</span>
            <select className={fieldCls} style={inputStyle} value={vignette.choice41 ?? ""} onChange={(e) => setVignette({ ...vignette, choice41: e.target.value })}>
              <option value="">—</option>
              <option value="a">Candidate A</option>
              <option value="b">Candidate B</option>
              <option value="no_difference">Genuinely no difference</option>
            </select>
          </label>
          <label className={labelCls}><span style={labelTextStyle}>4.3 Would read it</span>
            <input className={fieldCls} style={inputStyle} value={vignette.wouldRead43 ?? ""} onChange={(e) => setVignette({ ...vignette, wouldRead43: e.target.value })} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}><span style={labelTextStyle}>4.2 Why</span>
            <textarea className={fieldCls} style={inputStyle} rows={2} value={vignette.why42 ?? ""} onChange={(e) => setVignette({ ...vignette, why42: e.target.value })} />
          </label>
          <label className={labelCls}><span style={labelTextStyle}>4.4 Unit of value</span>
            <input className={fieldCls} style={inputStyle} value={vignette.unitOfValue44 ?? ""} onChange={(e) => setVignette({ ...vignette, unitOfValue44: e.target.value })} />
          </label>
          <label className={labelCls}><span style={labelTextStyle}>4.4 Exact words</span>
            <input className={fieldCls} style={inputStyle} value={vignette.exactWords44 ?? ""} onChange={(e) => setVignette({ ...vignette, exactWords44: e.target.value })} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}><span style={labelTextStyle}>4.5 What would make them distrust it</span>
            <textarea className={fieldCls} style={inputStyle} rows={2} value={vignette.distrust45 ?? ""} onChange={(e) => setVignette({ ...vignette, distrust45: e.target.value })} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}><span style={labelTextStyle}>4.6 What was missing</span>
            <textarea className={fieldCls} style={inputStyle} rows={2} value={vignette.missing46 ?? ""} onChange={(e) => setVignette({ ...vignette, missing46: e.target.value })} />
          </label>
          <label className={labelCls}><span style={labelTextStyle}>5.1 Stage it would be used</span>
            <select className={fieldCls} style={inputStyle} value={vignette.stage51 ?? ""} onChange={(e) => setVignette({ ...vignette, stage51: e.target.value })}>
              <option value="">—</option>
              {STAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className={labelCls}><span style={labelTextStyle}>5.2 Who owns that stage</span>
            <select className={fieldCls} style={inputStyle} value={vignette.owner52 ?? ""} onChange={(e) => setVignette({ ...vignette, owner52: e.target.value })}>
              <option value="">—</option>
              {OWNER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className={labelCls}><span style={labelTextStyle}>5.3 Required format</span>
            <select className={fieldCls} style={inputStyle} value={vignette.format53 ?? ""} onChange={(e) => setVignette({ ...vignette, format53: e.target.value })}>
              <option value="">—</option>
              {FORMAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className={labelCls}><span style={labelTextStyle}>5.4 What it competes with</span>
            <input className={fieldCls} style={inputStyle} value={vignette.competesWith54 ?? ""} onChange={(e) => setVignette({ ...vignette, competesWith54: e.target.value })} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}><span style={labelTextStyle}>5.5 Their first question to the institution</span>
            <textarea className={fieldCls} style={inputStyle} rows={2} value={vignette.firstQuestion55 ?? ""} onChange={(e) => setVignette({ ...vignette, firstQuestion55: e.target.value })} />
          </label>
        </div>
      </section>

      {/* Verbatims */}
      <section className="rounded-lg border p-5" style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}>
        <h2 className="font-medium" style={{ color: "var(--text-primary)" }}>Verbatims</h2>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Their exact words. Do not paraphrase.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input className={fieldCls} style={inputStyle} placeholder="Block (e.g. 2.2)" value={newVerbatim.block} onChange={(e) => setNewVerbatim({ ...newVerbatim, block: e.target.value })} />
          <input className={fieldCls} style={inputStyle} placeholder="Construct code" value={newVerbatim.constructCode} onChange={(e) => setNewVerbatim({ ...newVerbatim, constructCode: e.target.value })} />
          <input className={`${fieldCls} sm:col-span-2`} style={inputStyle} placeholder="Their exact words" value={newVerbatim.quote} onChange={(e) => setNewVerbatim({ ...newVerbatim, quote: e.target.value })} />
          <input className={`${fieldCls} sm:col-span-3`} style={inputStyle} placeholder="Why it matters / where it could be used" value={newVerbatim.whyItMatters} onChange={(e) => setNewVerbatim({ ...newVerbatim, whyItMatters: e.target.value })} />
          <button type="button" onClick={addVerbatim} className="rounded-md px-3 py-2 text-sm font-medium text-white" style={{ background: "var(--series-cognition)" }}>Add</button>
        </div>
        <ul className="mt-5 flex flex-col gap-3">
          {verbatims.map((v) => (
            <li key={v.id} className="rounded-md border p-3 text-sm" style={{ borderColor: "var(--gridline)" }}>
              <p style={{ color: "var(--text-primary)" }}>&ldquo;{v.quote}&rdquo;</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {[v.block, v.constructCode].filter(Boolean).join(" · ")}{v.whyItMatters ? ` — ${v.whyItMatters}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CardSelect({ value, onChange }: { value: number | string | null; onChange: (v: number | null) => void }) {
  return (
    <select
      className={fieldCls}
      style={inputStyle}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">—</option>
      {CARD_DECK.map((c) => (
        <option key={c.number} value={c.number}>{c.number} · {c.code} · {c.text.slice(0, 40)}…</option>
      ))}
    </select>
  );
}

function CardSlotGroup({
  label, keys, cardSort, setCardSort,
}: { label: string; keys: string[]; cardSort: CardSort; setCardSort: (v: CardSort) => void }) {
  return (
    <div>
      <p className="mb-1 text-sm" style={labelTextStyle}>{label}</p>
      <div className="flex flex-col gap-1.5">
        {keys.map((k) => (
          <CardSelect key={k} value={cardSort[k] ?? null} onChange={(v) => setCardSort({ ...cardSort, [k]: v })} />
        ))}
      </div>
    </div>
  );
}
