export type Arm = "A" | "B";

// Single shared link, random 50/50 arm assignment at entry (per the item
// bank's build notes — Typeform's hidden-field randomiser, adapted here).
export function assignArm(): Arm {
  return Math.random() < 0.5 ? "A" : "B";
}
