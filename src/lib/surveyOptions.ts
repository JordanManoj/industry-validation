// Option lists, wired to match the Survey Item Bank v0.9 wording exactly.
// { value } is a stable slug stored in the DB; { label } is shown on screen.

export interface Opt {
  value: string;
  label: string;
}

export const ROLE_OPTIONS: Opt[] = [
  { value: "ta_campus", label: "Talent acquisition / campus hiring" },
  { value: "hm_technical", label: "Hiring manager (engineering or technical)" },
  { value: "hm_non_technical", label: "Hiring manager (non-technical)" },
  { value: "founder_cto", label: "Founder / CTO / tech lead" },
  { value: "ld", label: "Learning & development / capability" },
  { value: "hrbp", label: "HR business partner" },
  { value: "other", label: "Other" },
];

export const SECTOR_OPTIONS: Opt[] = [
  { value: "it_ites", label: "IT services / ITES" },
  { value: "product", label: "Product or software company" },
  { value: "gcc", label: "Global capability centre (GCC)" },
  { value: "bfsi", label: "BFSI" },
  { value: "consulting", label: "Consulting" },
  { value: "manufacturing", label: "Manufacturing or core engineering" },
  { value: "startup", label: "Startup, under 50 people" },
  { value: "other", label: "Other" },
];

export const ORG_SIZE_OPTIONS: Opt[] = [
  { value: "under_50", label: "Under 50" },
  { value: "50_250", label: "50–250" },
  { value: "251_1000", label: "251–1,000" },
  { value: "1001_10000", label: "1,001–10,000" },
  { value: "over_10000", label: "Over 10,000" },
];

export const HIRE_VOLUME_OPTIONS: Opt[] = [
  { value: "0", label: "0" },
  { value: "1_5", label: "1–5" },
  { value: "6_20", label: "6–20" },
  { value: "21_100", label: "21–100" },
  { value: "over_100", label: "Over 100" },
];

export const INTAKE_TREND_OPTIONS: Opt[] = [
  { value: "sub_higher", label: "Substantially higher" },
  { value: "some_higher", label: "Somewhat higher" },
  { value: "same", label: "About the same" },
  { value: "some_lower", label: "Somewhat lower" },
  { value: "sub_lower", label: "Substantially lower" },
  { value: "dont_know", label: "Don't know" },
];

export const AI_MATURITY_OPTIONS: Opt[] = [
  { value: "none", label: "None" },
  { value: "a_few", label: "A few" },
  { value: "about_half", label: "About half" },
  { value: "most", label: "Most" },
  { value: "nearly_everyone", label: "Nearly everyone" },
  { value: "dont_know", label: "Don't know" },
];

export const FORMAL_TRAINING_OPTIONS: Opt[] = [
  { value: "yes_mandatory", label: "Yes, mandatory" },
  { value: "yes_optional", label: "Yes, optional" },
  { value: "in_planning", label: "In planning" },
  { value: "no", label: "No" },
  { value: "dont_know", label: "Don't know" },
];

export const SLIPPED_2_1_OPTIONS: Opt[] = [
  { value: "yes_multiple", label: "Yes, more than once" },
  { value: "yes_once", label: "Yes, once" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "Not sure" },
];

export const ASSESS_AI_USE_OPTIONS: Opt[] = [
  { value: "yes_watch", label: "Yes, and we watch how they use it" },
  { value: "yes_no_assess", label: "Yes, but we don't assess the use itself" },
  { value: "no", label: "No, explicitly prohibited" },
  { value: "undecided", label: "We haven't decided" },
  { value: "na", label: "Not applicable" },
];

export const DISTINCTION_MATCH_OPTIONS: Opt[] = [
  { value: "yes_closely", label: "Yes, closely" },
  { value: "roughly", label: "Roughly" },
  { value: "not_really", label: "Not really" },
  { value: "no_cut_differently", label: "No, I'd cut it differently" },
];

export const FRAMING_CHANGED_OPTIONS: Opt[] = [
  { value: "yes_substantially", label: "Yes, substantially" },
  { value: "a_little", label: "A little" },
  { value: "no", label: "No" },
];

export const VIGNETTE_CHOICE_OPTIONS: Opt[] = [
  { value: "a", label: "Candidate A" },
  { value: "b", label: "Candidate B" },
  { value: "no_difference", label: "Genuinely no difference" },
];

export const WOULD_READ_OPTIONS: Opt[] = [
  { value: "yes_full", label: "Yes, in full" },
  { value: "skim", label: "I'd skim it" },
  { value: "only_if_shortlisted", label: "Only if they reached interview" },
  { value: "no_noise", label: "No, it's noise" },
];

export const CONSTANT_SUM_CATEGORIES: Opt[] = [
  { value: "faster_interview", label: "Faster to an interview call" },
  { value: "higher_band", label: "A higher starting band" },
  { value: "shorter_ramp", label: "A shorter ramp-up expectation" },
  { value: "more_autonomy", label: "More autonomy earlier" },
  { value: "nothing", label: "Nothing — it wouldn't change anything" },
];

export const DISTRUST_OPTIONS: Opt[] = [
  { value: "unverifiable", label: "No way to verify it was really their process" },
  { value: "written_after", label: "Easy to write after the fact" },
  { value: "too_polished", label: "Too polished, looks coached" },
  { value: "trust_it", label: "I'd trust it" },
  { value: "other", label: "Other" },
];

export const STAGE_OPTIONS: Opt[] = [
  { value: "application_screening", label: "Application screening" },
  { value: "shortlisting", label: "Shortlisting" },
  { value: "technical_assessment", label: "Technical assessment" },
  { value: "interview_prep", label: "Interview preparation" },
  { value: "final_decision", label: "Final decision" },
  { value: "onboarding", label: "Onboarding and ramp planning" },
  { value: "nowhere", label: "Nowhere in our process" },
];

export const FORMAT_OPTIONS: Opt[] = [
  { value: "score", label: "A single score" },
  { value: "badge", label: "A tiered badge or level" },
  { value: "link", label: "A link to the work itself" },
  { value: "ats_field", label: "A structured field in our ATS" },
  { value: "summary", label: "A one-page summary the interviewer reads beforehand" },
  { value: "verified", label: "Verified by a named practitioner" },
  { value: "other", label: "Other" },
];

export const OWNER_OPTIONS: Opt[] = [
  { value: "me", label: "Me" },
  { value: "my_manager", label: "My manager" },
  { value: "central_ta", label: "A central TA function" },
  { value: "hiring_committee", label: "A hiring committee" },
  { value: "nobody", label: "Nobody has clear ownership" },
  { value: "dont_know", label: "Don't know" },
];

export const ORG_AI_CAPABILITY_OPTIONS: Opt[] = [
  { value: "vendor_courses", label: "Vendor courses or licences" },
  { value: "internal_curriculum", label: "Internal curriculum" },
  { value: "certification", label: "Certification pathway" },
  { value: "communities", label: "Communities of practice or champions" },
  { value: "hackathons", label: "Hackathons or challenges" },
  { value: "nothing_formal", label: "Nothing formal" },
  { value: "dont_know", label: "Don't know" },
];

export const ORG_AI_MEASURE_OPTIONS: Opt[] = [
  { value: "completion_rates", label: "Completion rates" },
  { value: "seat_usage", label: "Tool licence or seat usage" },
  { value: "self_reported_time", label: "Self-reported time saved" },
  { value: "observed_output", label: "Observed output or cycle time" },
  { value: "quality_defect", label: "Quality or defect measures" },
  { value: "nothing_systematic", label: "Nothing systematic" },
  { value: "dont_know", label: "Don't know" },
];

export const SHARE_CHANGED_OPTIONS: Opt[] = [
  { value: "nearly_all", label: "Nearly all" },
  { value: "most", label: "Most" },
  { value: "about_half", label: "About half" },
  { value: "minority", label: "A minority" },
  { value: "very_few", label: "Very few" },
  { value: "dont_know", label: "We don't know" },
];

export const EFFICIENCY_OPTIONS: Opt[] = [
  { value: "measured_clear", label: "Yes, measured and clear" },
  { value: "self_reported", label: "Yes, but only self-reported" },
  { value: "believed_not_measured", label: "Believed, not measured" },
  { value: "no", label: "No" },
  { value: "too_early", label: "Too early to say" },
  { value: "dont_know", label: "Don't know" },
];

export const DISTINGUISH_OPTIONS: Opt[] = [
  { value: "yes_separate", label: "Yes, explicitly, with separate programmes" },
  { value: "yes_in_principle", label: "Yes, in principle, not in practice" },
  { value: "no", label: "No" },
  { value: "not_meaningful", label: "I don't think that's a meaningful distinction" },
];

export const PANEL_WILLINGNESS_OPTIONS: Opt[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe, tell me more" },
  { value: "no", label: "No" },
];
