export type Answers = boolean[]; // length 6

export const QUESTIONS: string[] = [
  "Do you use AI to help you write or refine work emails, messages, or documents?",
  "Have you ever pasted work-related information into an AI tool to get better results?",
  "Do you use AI tools that you discovered on your own, rather than ones your company formally introduced?",
  "Do you rely on AI output as a starting point without always saving or documenting what you asked it?",
  "If someone asked you to list every AI tool you’ve used for work in the past month, would you have to think about it?",
  "Has AI become something you reach for automatically when you’re under time pressure at work?",
];

// YES = risk present (weighted toward embedded habit + traceability issues)
const WEIGHTS = [12, 18, 18, 18, 14, 20];

export function scoreAnswers(a: Answers): number {
  if (a.length !== 6) throw new Error("Expected 6 answers");
  let s = 0;
  for (let i = 0; i < 6; i++) if (a[i]) s += WEIGHTS[i];
  return Math.max(0, Math.min(100, s));
}

export function verdict(score: number): string {
  if (score <= 20) return "Low personal AI risk.";
  if (score <= 40) return "Growing risk.";
  if (score <= 60) return "Meaningful risk.";
  if (score <= 80) return "High risk.";
  return "Unmanaged risk.";
}

export function bandMicrocopy(): string {
  const MICRO = [
    "Most people underestimate how quickly AI becomes part of their workflow.",
    "This score reflects habits, not intent.",
    "Speed usually comes before guardrails.",
    "AI risk often enters through individual behavior.",
  ];
  return MICRO[Math.floor(Math.random() * MICRO.length)];
}
