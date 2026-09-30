# ClimbSphere — Industry Validation

Standalone app supporting the AI Cognition industry validation research programme
(the Discovery Field Kit, the Response Capture Workbook, and the Survey Item Bank
v0.9). It tests one question: **do employers value how early-career hires *think*
when working with AI ("AI cognition") more than how well they operate the tools
("AI skills") — and would they use evidence of it in hiring?**

Independent of the main `climbsphere-studio-v3` product — separate `package.json`,
separate deploy, no shared code or domain rules.

**Production:** https://industry-validation.vercel.app (admin at `/admin`)

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**, Tailwind CSS 4
- **Postgres** via **Drizzle ORM** — [Neon](https://neon.tech) in production,
  embedded **PGlite** locally (no setup needed)
- **Zod** for validating every survey and admin write
- Hosted on **Vercel**; pushes to `main` deploy automatically

## What's here

### Participant survey — `/s/[token]`

Sections 1–7 of the item bank: firmographics, recent experience, the split-sample
cognition/skills definition (Arm B only), a MaxDiff valuation task, the two-candidate
vignette, signal-slot questions, org AI capability, and close. Random 50/50 Arm A/B
assignment per respondent. Answers save section by section, so a respondent can
leave and come back. **Gated** — see [Why the survey is gated](#why-the-survey-is-gated).

Two kinds of link:

| Link | Who it's for | Tracking |
|---|---|---|
| **Shared link** — `/s/<SURVEY_LINK_TOKEN>` | Anyone you post it to | Anonymous |
| **Personal link** — `/s/<invite token>`, created in **Admin → Invites** | One named person | Response is tied to that person |

Personal links always resume the same response (any device), can't be submitted
twice, and tell the respondent their answers are confidential rather than anonymous.

After **Submit**, a link is frozen on a *"Thanks for taking the survey"* message:
personal links on any device (checked against the database), the shared link in
the browser that submitted it (a cookie — the shared link has to keep working for
everyone else). Submitted responses can't be edited.

### Admin — `/admin` (password-protected)

| Page | What it does |
|---|---|
| **Overview** | Progress at a glance — interviews logged (of 16), Arm A/B split, survey open/gated, survey completes (target n ≥ 60) |
| **Interview log** | Web version of the Response Capture Workbook (Respondent Log, Construct Tally, Card Sort, Vignette Journey, Verbatims) for the 16 discovery interviews |
| **Kill criteria** | K1–K6, pre-registered, computed live from interview and survey data |
| **Survey analytics** | MaxDiff utility ranking, cognition/skills/decoy share, the Arm A/B framing effect (reported first, per the analysis plan), the value × assessability wedge, candidate preference, signal slot/format, skilling-to-efficiency, rater panel count — cross-tabulable by role and AI maturity |
| **Responses** | Every survey response in readable question → answer form, with respondent name/organisation for personal links. Filter complete vs. all; **Download CSV** (one row per response, one column per question — opens in Excel) |
| **Invites** | Create personal survey links (one at a time, or paste a list from Excel), copy links, see who has **Not opened / Started / Completed**, download all links as CSV for mail merge. Unopened links can be deleted |
| **Settings** | Survey open/closed gate, and the shared (anonymous) link built from the address you're viewing the admin on |

## Survey change log

| Date | Change |
|---|---|
| 28 Sep 2026 | Q2.1 reworded: *"Has a junior employee ever submitted AI work that was wrong or unchecked, and your team failed to catch the mistake before it went too far?"* |
| 28 Sep 2026 | Section 4: removed the 100-point allocation question and "What would make you distrust a record like that?" (and the related "mean points" chart) |
| 29 Sep 2026 | MaxDiff card S2 reworded to *"Knows their way around the many AI tools, and which one to use when"* (also in the interview card sort) |
| 29 Sep 2026 | "Hardest to assess" changed from a single dropdown to checkboxes — *"Which of them are hardest to assess in your hiring process today? (max of 4)"* |
| 29 Sep 2026 | Attention check ("Please select 'A shorter ramp-up expectation'") removed |
| 29 Sep 2026 | Personal survey links (Admin → Invites) added alongside the anonymous shared link |
| 30 Sep 2026 | After **Submit**, the link freezes on *"Thanks for taking the survey"* — personal links on every device, the shared link in the browser that submitted it |
| 30 Sep 2026 | **Submit survey** button on every page. If a required section (About you, MaxDiff, Two candidates) is unanswered it takes the respondent there first; otherwise it asks for confirmation and submits, skipping the optional questions left |

Responses collected before a change keep their original answers in the database;
analytics handle both the old single "hardest to assess" pick and the new multi-pick.

## Why the survey is gated

The item bank is marked "PARKED — do not field until after interview 10," with
placeholder language in Sections 3A and 6 meant to be replaced with practitioners'
own words from the interviews first. The app enforces this: nobody can reach or
complete the survey (shared or personal link) until an admin opens the gate in
Settings, which asks for confirmation before flipping it.

## Where the data lives

Everything is in Postgres (Neon in production). Tables are defined twice, kept in
sync by hand: `src/db/schema-sql.ts` (the bootstrap SQL that creates them) and
`src/db/schema.ts` (Drizzle definitions used by the code).

| Table | Holds |
|---|---|
| `interviews` | One row per discovery interview |
| `construct_tallies`, `card_sorts`, `vignette_journeys`, `verbatims` | Interview detail |
| `survey_responses` | One row per survey attempt — `status` (`in_progress` / `complete`), `arm`, timings, answers per section as JSON (`section1` … `section7`), and `invite_id` for personal-link responses |
| `survey_invites` | Personal links — name, email, organisation, token |
| `settings` | The survey open/closed gate |

To read raw data: Neon console → your project → **Tables**, or **SQL Editor**, e.g.

```sql
SELECT * FROM survey_responses WHERE status = 'complete' ORDER BY completed_at DESC;
```

For day-to-day use, **Admin → Responses → Download CSV** is easier.

## Local development

No external account or database needed. With `DATABASE_URL` unset the app uses an
embedded PGlite database (real Postgres SQL, persisted to `.pglite-data/`).

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD, ADMIN_SESSION_SECRET, SURVEY_LINK_TOKEN
npm run dev
```

Visit `http://localhost:3000/admin` and sign in with `ADMIN_PASSWORD`. The shared
survey link is shown in Settings; personal links are created in Invites.

Tables are created automatically on first request (idempotent `CREATE TABLE IF NOT
EXISTS` / `ADD COLUMN IF NOT EXISTS`), locally and in production — there's no
separate migration step. New tables or columns added to `schema-sql.ts` apply
themselves on the next deploy.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. Leave empty locally (PGlite). In production use Neon's **pooled** string (host contains `-pooler`) |
| `ADMIN_PASSWORD` | Password for `/admin` — use a strong one; the login page is public |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie |
| `SURVEY_LINK_TOKEN` | The unguessable path segment of the shared survey link |

Generate secrets with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
Never commit `.env.local` (it's gitignored).

## Deploying (Vercel + Neon)

1. Create a Neon project and copy its **pooled** connection string.
2. Import this repo into Vercel (framework preset: Next.js, root directory `./`).
3. Set the four environment variables above in Vercel → Settings → Environment
   Variables.
4. Set Vercel → Settings → Functions → region close to the database (Neon
   `us-east-2` → Vercel `iad1`), then deploy.
5. Sign in at `/admin`, confirm the gate is closed, and log interviews as they
   happen. When you're ready to field the survey, open the gate in Settings and
   send the shared link or personal links from Invites.

Custom domain (e.g. `survey.climbsphere.ai`): add it in Vercel → Domains, then add
the CNAME record Vercel shows at the domain's DNS provider. The Settings and Invites
pages build links from whatever address you open the admin on.

`drizzle-kit` (`npm run db:generate` / `db:push` / `db:studio`) is wired up if you'd
rather manage schema changes as tracked migrations instead of the bootstrap SQL.

## Notes on the analytics

- **MaxDiff utility** uses best-minus-worst counting
  (`(timesBest − timesWorst) / timesShown`), not hierarchical Bayes — a reasonable
  live-monitoring approximation at this sample size.
- **Hardest to assess** (the wedge chart) is the share of respondents who ticked
  each item; since respondents can tick up to 4, shares don't sum to 100%.
- **Kill criteria K1–K4** read "insufficient data" until at least 8 interviews are
  marked done, matching the workbook's rule.
- **K3, K4, K5 and K6** blend interview and survey sources where both instruments
  feed the same signal. The dashboard always shows the split by source.
- Open-text answers are stored verbatim and shown in full on the Responses page and
  in the CSV. The app does not auto-code qualitative responses.
- CSV exports neutralise cells starting with `=`, `+`, `-` or `@` so respondent text
  can't run as an Excel formula.

## Project structure

```
src/
  app/
    s/[token]/          Survey (entry page + SurveyWizard)
    admin/(dashboard)/  Admin pages: interviews, kill-criteria, survey-analytics,
                        responses, invites, settings
    api/survey/         start / save / complete
    api/admin/          login, logout, settings, interviews, responses (CSV),
                        invites (+ export CSV)
  db/                   client.ts (connection), schema.ts, schema-sql.ts
  lib/                  analytics, constructs (card deck), surveyOptions,
                        surveySchemas, responseExport, invites, auth
```
