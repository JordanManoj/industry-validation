import { z } from "zod";

// Sections 1, 3B and 4 are required (per the item bank's build notes).
// Everything else — including every open-text field anywhere — is optional.

export const section1Schema = z.object({
  role: z.string().min(1),
  roleOther: z.string().optional(),
  sector: z.string().min(1),
  sectorOther: z.string().optional(),
  orgSize: z.string().min(1),
  hireVolume: z.string().min(1),
  intakeTrend: z.string().min(1),
  aiMaturity: z.string().min(1),
  formalTraining: z.string().min(1),
});
export type Section1 = z.infer<typeof section1Schema>;

export const section2Schema = z.object({
  gotThroughUnprompted: z.string().optional().nullable(),
  whatLetItThrough: z.string().optional(),
  assessAiUse: z.string().optional().nullable(),
  whatWatchingFor: z.string().optional(),
});
export type Section2 = z.infer<typeof section2Schema>;

export const section3aSchema = z.object({
  distinctionMatch: z.string().optional().nullable(),
  howCutDifferently: z.string().optional(),
});
export type Section3A = z.infer<typeof section3aSchema>;

const maxDiffPickSchema = z.object({
  setIndex: z.number(),
  itemCodes: z.array(z.string()).length(4),
  best: z.string().min(1),
  worst: z.string().min(1),
});

export const section3bSchema = z
  .object({
    maxDiffPicks: z.array(maxDiffPickSchema).length(5),
    hardestToAssess: z.string().min(1),
    framingChanged: z.string().optional().nullable(), // Arm B only
  })
  .refine(
    (v) => v.maxDiffPicks.every((p) => p.best !== p.worst),
    { message: "Best and worst can't be the same item in one set" }
  );
export type Section3B = z.infer<typeof section3bSchema>;

export const section4Schema = z
  .object({
    choice: z.string().min(1),
    wouldRead: z.string().min(1),
    constantSum: z.object({
      faster_interview: z.number().min(0).max(100),
      higher_band: z.number().min(0).max(100),
      shorter_ramp: z.number().min(0).max(100),
      more_autonomy: z.number().min(0).max(100),
      nothing: z.number().min(0).max(100),
    }),
    distrust: z.array(z.string()).min(1),
    distrustOther: z.string().optional(),
  })
  .refine(
    (v) =>
      Object.values(v.constantSum).reduce((a, b) => a + b, 0) === 100,
    { message: "The five points must add up to exactly 100" }
  );
export type Section4 = z.infer<typeof section4Schema>;

export const section5Schema = z.object({
  stage: z.array(z.string()).optional(),
  format: z.array(z.string()).optional(),
  owner: z.string().optional().nullable(),
  attentionCheck: z.string().optional().nullable(), // 5.4, same options as constant-sum categories
  firstQuestion: z.string().optional(),
});
export type Section5 = z.infer<typeof section5Schema>;

export const section6Schema = z.object({
  capability: z.array(z.string()).optional(),
  measure: z.array(z.string()).optional(),
  shareChanged: z.string().optional().nullable(),
  efficiency: z.string().optional().nullable(),
  distinguish: z.string().optional().nullable(),
  oneThingToMeasure: z.string().optional(),
});
export type Section6 = z.infer<typeof section6Schema>;

export const section7Schema = z.object({
  missedAnything: z.string().optional(),
  panelWillingness: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
});
export type Section7 = z.infer<typeof section7Schema>;

export const ATTENTION_CHECK_CORRECT = "shorter_ramp";
