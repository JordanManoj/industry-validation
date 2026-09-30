// Idempotent bootstrap DDL, kept in lockstep with schema.ts by hand.
// See client.ts for why this exists instead of a required migration step.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  date date,
  arm text NOT NULL,
  persona text NOT NULL,
  name text,
  role_title text,
  organisation text,
  sector text,
  hire_volume_band text,
  ai_maturity_band text,
  formal_training text,
  interview_done boolean NOT NULL DEFAULT false,
  panel_ask text,
  panel_condition text,
  one_surprise text,
  best_quote text,
  referrals text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS construct_tallies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
  c1 boolean NOT NULL DEFAULT false,
  c2 boolean NOT NULL DEFAULT false,
  c3 boolean NOT NULL DEFAULT false,
  c4 boolean NOT NULL DEFAULT false,
  c5 boolean NOT NULL DEFAULT false,
  c6 boolean NOT NULL DEFAULT false,
  c7 boolean NOT NULL DEFAULT false,
  s1 boolean NOT NULL DEFAULT false,
  s2 boolean NOT NULL DEFAULT false,
  s3 boolean NOT NULL DEFAULT false,
  s4 boolean NOT NULL DEFAULT false,
  other_construct text
);

CREATE TABLE IF NOT EXISTS card_sorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
  top1 integer, top2 integer, top3 integer, top4 integer, top5 integer,
  bottom1 integer, bottom2 integer, bottom3 integer,
  resort1 integer, resort2 integer, resort3 integer, resort4 integer, resort5 integer,
  hardest_to_find integer,
  hardest_to_check integer
);

CREATE TABLE IF NOT EXISTS vignette_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
  choice_41 text,
  why_42 text,
  would_read_43 text,
  unit_of_value_44 text,
  exact_words_44 text,
  distrust_45 text,
  missing_46 text,
  stage_51 text,
  owner_52 text,
  format_53 text,
  competes_with_54 text,
  first_question_55 text
);

CREATE TABLE IF NOT EXISTS verbatims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  block text,
  construct_code text,
  quote text NOT NULL,
  why_it_matters text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arm text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  started_at timestamp NOT NULL DEFAULT now(),
  completed_at timestamp,
  duration_seconds integer,
  attention_check_passed boolean,
  section1 jsonb,
  section2 jsonb,
  section3a jsonb,
  section3b jsonb,
  section4 jsonb,
  section5 jsonb,
  section6 jsonb,
  section7 jsonb
);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  name text NOT NULL,
  email text,
  organisation text,
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS invite_id uuid REFERENCES survey_invites(id) ON DELETE SET NULL;
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS last_step text;
CREATE UNIQUE INDEX IF NOT EXISTS survey_responses_invite_id_key ON survey_responses (invite_id) WHERE invite_id IS NOT NULL;
`;
