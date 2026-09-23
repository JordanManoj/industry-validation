import { CARD_BY_CODE, CardItem } from "./constructs";

// Balanced incomplete block design for the 3B MaxDiff task: 14 items shown
// in 5 sets of 4. Every item appears at least once (6 items appear twice,
// 8 appear once — 20 slots total), no item appears twice within a set, and
// every set mixes categories so the grouping is never visible from the
// question itself. Per the item bank's build note: never show codes, never
// group by category, randomise item order within each set.
const DESIGN_CODES: string[][] = [
  ["C1", "C4", "S2", "D2"],
  ["C2", "C7", "S4", "D1"],
  ["C3", "C5", "S1", "D2"],
  ["C6", "C7", "S2", "D3"],
  ["C1", "C4", "S3", "S4"],
];

export interface MaxDiffSet {
  setIndex: number;
  items: CardItem[];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deterministic PRNG (mulberry32) seeded per response so a page refresh
// mid-survey shows the same randomised order instead of reshuffling.
function seededRng(seed: number) {
  let t = seed;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export function buildMaxDiffSets(responseId: string): MaxDiffSet[] {
  const rng = seededRng(seedFromString(responseId));
  const setOrder = shuffle(
    DESIGN_CODES.map((codes, i) => ({ codes, i })),
    rng
  );
  return setOrder.map(({ codes }, orderIdx) => ({
    setIndex: orderIdx,
    items: shuffle(
      codes.map((c) => CARD_BY_CODE.get(c)!),
      rng
    ),
  }));
}
