# ClimbSphere — Industry Validation

Standalone app supporting the AI Cognition industry validation research programme
described in `Industry Validation/` (the Discovery Field Kit, the Response Capture
Workbook, and the parked Survey Item Bank v0.9). Independent of the main
`climbsphere-studio-v3` product — separate `package.json`, separate deploy, no
shared code or domain rules.

## What's here

- **`/s/[token]`** — the participant-facing survey (Sections 1–7 of the item bank:
  firmographics, behavioural baseline, the split-sample cognition/skills
  definition, a MaxDiff valuation task, the artefact vignette, signal-slot
  questions, org capability, close). Single shared link, random 50/50 Arm A/B
  assignment per respondent. **Gated** — see below.
- **`/admin`** (password-protected) — the researcher's tools:
  - **Interview log** — a web version of the Response Capture Workbook's
    Respondent Log / Construct Tally / Card Sort / Vignette-Journey / Verbatims
    sheets, for the 16 live discovery interviews.
  - **Kill criteria** — K1–K6, pre-registered, computed live from interview and
    (once open) survey data.
  - **Survey analytics** — MaxDiff utility ranking, cognition/skills/decoy
    share, the Arm A/B framing effect (reported first, per the analysis plan),
    the value × assessability wedge, portfolio currency, signal slot/format,
    skilling-to-efficiency, and the rater panel count — all cross-tabulable by
    role and AI maturity.
  - **Settings** — the survey open/closed gate, and the secured link to send.

## Why the survey is gated

The item bank is explicitly marked "PARKED — do not field until after
interview 10," with placeholder language in Sections 3A and 6 that's meant to
be replaced with practitioners' own words from the interviews first. The app
enforces this: nobody can reach or complete `/s/[token]` until an admin opens
the gate in Settings, which asks for confirmation before flipping it.

## Local development

No external account or database needed. `DATABASE_URL` unset makes the app
fall back to an embedded PGlite database (real Postgres SQL, persisted to
`.pglite-data/`).

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD, ADMIN_SESSION_SECRET, SURVEY_LINK_TOKEN
npm run dev
```

Visit `http://localhost:3000/admin` and sign in with `ADMIN_PASSWORD`. The
survey link is `http://localhost:3000/s/<SURVEY_LINK_TOKEN>` — open it from
Settings once you flip the gate.

Tables are created automatically on first request (idempotent `CREATE TABLE IF
NOT EXISTS`); there's no separate migration step to run locally.

## Deploying (Vercel + hosted Postgres)

1. Create a Postgres database (e.g. [Neon](https://neon.tech) — has a free
   tier that works well with Vercel) and copy its connection string.
2. Push this folder to its own Vercel project (`vercel` CLI, or import the
   repo and set the project **root directory** to `industry-validation/`).
3. Set environment variables in Vercel: `DATABASE_URL`, `ADMIN_PASSWORD`,
   `ADMIN_SESSION_SECRET`, `SURVEY_LINK_TOKEN` (generate the two secrets with
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
4. Deploy. Tables bootstrap themselves on first request, same as local dev.
5. Sign in at `/admin`, confirm the gate is closed, log interviews as they
   happen. When you're ready to field the survey (after interview 10, with
   Sections 3A/6 rewritten in practitioners' language — see
   `Survey Item Bank v0.9`), open the gate in Settings and send the link shown
   there.

`drizzle-kit` (`npm run db:generate` / `db:push` / `db:studio`) is wired up if
you'd rather manage schema changes as tracked migrations against the hosted
database instead of relying on the bootstrap DDL.

## Notes on the analytics

- **MaxDiff utility** uses the standard best-minus-worst counting method
  (`(timesBest − timesWorst) / timesShown`), not hierarchical Bayes — a
  reasonable live-monitoring approximation at this sample size. Revisit if the
  programme moves to individual-level utilities.
- **Kill criteria K1–K4** read "insufficient data" until at least 8 interviews
  are marked done, matching the workbook's own rule (a percentage of three
  respondents is theatre, not evidence).
- **K3, K4, K5 and K6** blend interview and survey sources where the source
  documents say both instruments feed the same signal (e.g. 7.4 in the
  interview and 7.2 in the survey both feed K5). The dashboard always shows
  the split by source, never just a merged number.
- Every open-text field is stored verbatim and shown in full on the interview
  edit page and is available via the database for coding — this app does not
  attempt to auto-code qualitative responses against the construct spine.
