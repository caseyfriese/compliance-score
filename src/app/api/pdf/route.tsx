import React from "react";
import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { ScorePdf } from "@/lib/ScorePdf";
import { verdict, bandMicrocopy, QUESTIONS } from "@/lib/scoring";

// Force Node runtime (react-pdf needs Node APIs)
export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const score = body?.score;
  const answers = body?.answers;

  if (typeof score !== "number" || !Array.isArray(answers)) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const gaps = answers
    .map((v: boolean, i: number) => (v ? null : QUESTIONS[i]))
    .filter(Boolean) as string[];

  // JSX is fine here because this file is .tsx
  const doc = (
    <ScorePdf
      score={score}
      verdict={verdict(score)}
      micro={bandMicrocopy()}
      gaps={gaps.length ? gaps : ["No gaps detected (rare)."]}
    />
  );

  try {
    const bytes = await pdf(doc).toBuffer();

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compliance-reality-${score}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "pdf_failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
