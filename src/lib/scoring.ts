export type Answers = boolean[]; // length 6

export const QUESTIONS: string[] = [
  "Do you have written security / compliance policies that reflect how your organization actually operates today?",
  "Have those policies been reviewed and updated within the last 12 months?",
  "Can you prove, with evidence, that in-scope employees have acknowledged and followed those policies?",
  "If an auditor asked tomorrow, could you produce complete, accurate evidence for your top 10 controls within 48 hours?",
  "Do your technical controls actually enforce what sales, legal, or leadership claims you do?",
  "If a control failed today, would you detect it automatically — or only discover it during an audit or incident?",
];

const WEIGHTS = [15, 15, 15, 15, 15, 25];

export function scoreAnswers(a: Answers): number {
  if (a.length !== 6) throw new Error("Expected 6 answers");
  let s = 0;
  for (let i = 0; i < 6; i++) if (a[i]) s += WEIGHTS[i];
  return Math.max(0, Math.min(100, s));
}

export function verdict(score: number): string {
  if (score <= 29) return "Foundational gaps present.";
  if (score <= 49) return "Policy-led, execution-constrained.";
  if (score <= 69) return "Operational, with blind spots.";
  if (score <= 84) return "Execution-driven and defensible.";
  return "Audit-resilient by design.";
}

export function bandMicrocopy(): string {
  return "Most organizations score between 35–55.";
}