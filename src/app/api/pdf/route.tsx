import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { ScorePdf } from "@/lib/ScorePdf";
import { verdict, bandMicrocopy } from "@/lib/scoring";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const score = body?.score;
  const answers = body?.answers;

  if (
    typeof score !== "number" ||
    !Array.isArray(answers)
  ) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  // Map "No" answers to gaps
  const gaps = answers
    .map((v: boolean, i: number) => (!v ? i : null))
    .filter((v: number | null) => v !== null)
    .map((i: number) => `Control ${i + 1} is policy-defined but not operationally verified`);

  const doc = (
    <ScorePdf
      score={score}
      verdict={verdict(score)}
      micro={bandMicrocopy()}
      gaps={gaps}
    />
  );

  const bytes = await pdf(doc).toBuffer();

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="compliance-reality-${score}.pdf"`,
    },
  });
}
