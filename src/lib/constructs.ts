// The construct spine — seven cognition constructs, four skill constructs,
// three decoy/context items (D1-D3). Source: Industry Validation Research
// Design, "The construct spine"; card text from the Survey Item Bank v0.9
// Section 3B item pool, which is the same 14-card deck used in the
// interview's Block 3 card sort.

export type Category = "cognition" | "skill" | "decoy";

export interface CardItem {
  code: string;
  number: number; // 1-14, used by the interview workbook's Card Sort sheet
  category: Category;
  text: string;
}

export const CARD_DECK: CardItem[] = [
  { code: "C1", number: 1, category: "cognition", text: "Takes a vague, badly-written brief and turns it into a clear problem with defined success criteria" },
  { code: "C2", number: 2, category: "cognition", text: "Decides correctly what to hand to AI and what to do themselves" },
  { code: "C3", number: 3, category: "cognition", text: "Checks AI output properly — catches what's wrong, incomplete, or quietly assumed" },
  { code: "C4", number: 4, category: "cognition", text: "Notices when the AI is agreeing with a mistake they have already made" },
  { code: "C5", number: 5, category: "cognition", text: "Designs where a human has to sign off inside an AI-assisted process, and can justify it" },
  { code: "C6", number: 6, category: "cognition", text: "Defends their work under questioning — owns the decision even though AI produced the draft" },
  { code: "C7", number: 7, category: "cognition", text: "Knows the edge of what they know, and escalates instead of bluffing" },
  { code: "S1", number: 8, category: "skill", text: "Writes prompts that get good results first time" },
  { code: "S2", number: 9, category: "skill", text: "Knows their way around the main AI tools, and which one to use when" },
  { code: "S3", number: 10, category: "skill", text: "Can set up retrieval over the company's own documents, or build a working agent" },
  { code: "S4", number: 11, category: "skill", text: "Has actually changed how they work day to day to use AI, not just tried it" },
  { code: "D1", number: 12, category: "decoy", text: "Writes and speaks clearly, to the right audience" },
  { code: "D2", number: 13, category: "decoy", text: "Learns new tools fast without being taught" },
  { code: "D3", number: 14, category: "decoy", text: "Delivers on time without being chased" },
];

export const CARD_BY_NUMBER = new Map(CARD_DECK.map((c) => [c.number, c]));
export const CARD_BY_CODE = new Map(CARD_DECK.map((c) => [c.code, c]));

// Seven cognition constructs + four skill constructs, for the interview's
// Construct Tally (Block 2, spontaneous mentions only).
export const CONSTRUCT_DEFS = [
  { code: "C1", label: "Problem framing under ambiguity", countsWhen: "they describe someone clarifying, re-scoping or defining the ask before using the tool", notWhen: "they only say the brief was 'clear' or 'unclear' with no action attached" },
  { code: "C2", label: "Delegation judgement", countsWhen: "they describe a choice about what to give the tool versus keep", notWhen: "they describe using AI for everything, or not at all, with no decision in it" },
  { code: "C3", label: "Output interrogation", countsWhen: "they describe checking, verifying, catching errors, spotting gaps or assumptions", notWhen: "they say the output 'was wrong' without any checking behaviour described" },
  { code: "C4", label: "Self-confirmation detection", countsWhen: "they describe the model agreeing with a human error, or confirmation-seeking use", notWhen: "generic 'it hallucinates' — that is C3, not C4" },
  { code: "C5", label: "Workflow checkpoint design", countsWhen: "they describe placing or needing a human sign-off inside a process", notWhen: "they describe their own approval step as a fact of the org, not as a design choice" },
  { code: "C6", label: "Accountability and defensibility", countsWhen: "they describe someone explaining, defending or owning AI-assisted work under questioning", notWhen: "they describe presentation skill with no interrogation in the story" },
  { code: "C7", label: "Calibration and escalation", countsWhen: "they describe someone knowing their limit, flagging uncertainty, or escalating", notWhen: "they describe someone asking a lot of questions generally" },
  { code: "S1", label: "Prompting craft", countsWhen: "they talk about prompt quality, phrasing, iteration technique", notWhen: "" },
  { code: "S2", label: "Tool fluency", countsWhen: "they name tools and which to use when", notWhen: "" },
  { code: "S3", label: "Retrieval / agents / MCP", countsWhen: "they mention RAG, agents, MCP, connected tools, evals", notWhen: "" },
  { code: "S4", label: "Workflow integration", countsWhen: "they describe AI being built into how work actually runs", notWhen: "" },
] as const;

export const PERSONAS: Record<string, string> = {
  M1: "TA / campus hiring lead",
  M2: "Engineering hiring manager",
  M3: "Founder / tech lead",
  M4: "L&D / capability head",
};

export function categoryOf(cardNumber: number | null | undefined): Category | null {
  if (cardNumber == null) return null;
  return CARD_BY_NUMBER.get(cardNumber)?.category ?? null;
}
