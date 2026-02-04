import React from "react";
import { pdf } from "@react-pdf/renderer";
import { ScorePdf } from "@/lib/ScorePdf";
import { verdict, bandMicrocopy, QUESTIONS } from "@/lib/scoring";

// Force Node runtime (react-pdf needs Node APIs)
export const runtime = "nodejs";

async function readableStreamToUint8Array(
  stream: ReadableStream<Uint8Array>
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);

  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }

  return out;
}

function asUint8Array(maybe: unknown): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v: any = maybe;

  if (!v) return new Uint8Array();

  if (v instanceof Uint8Array) return v;
  if (v instanceof ArrayBuffer) return new Uint8Array(v);

  // Buffer is a Uint8Array subclass, so this covers it too.
  try {
    return new Uint8Array(v);
  } catch {
    return new Uint8Array();
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const score = body?.score;
  const answers = body?.answers;

  if (typeof score !== "number" || !Array.isArray(answers)) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  const gaps = answers
    .map((v: boolean, i: number) => (v ? null : QUESTIONS[i]))
    .filter(Boolean) as string[];

  const doc = (
    <ScorePdf
      score={score}
      verdict={verdict(score)}
      micro={bandMicrocopy()}
      gaps={gaps.length ? gaps : ["No gaps detected (rare)."]}
    />
  );

  try {
    const instance = pdf(doc) as unknown as {
      toBuffer?: () => Promise<unknown>;
      toStream?: () => Promise<unknown>;
    };

    let out: Uint8Array = new Uint8Array();

    if (instance.toBuffer) {
      const maybe = await instance.toBuffer();
      if (maybe && typeof (maybe as any)?.getReader === "function") {
        out = await readableStreamToUint8Array(maybe as ReadableStream<Uint8Array>);
      } else {
        out = asUint8Array(maybe);
      }
    } else if (instance.toStream) {
      const maybeStream = await instance.toStream();
      if (maybeStream && typeof (maybeStream as any)?.getReader === "function") {
        out = await readableStreamToUint8Array(
          maybeStream as ReadableStream<Uint8Array>
        );
      } else {
        return Response.json(
          { error: "pdf_failed", detail: "Unsupported stream type from react-pdf" },
          { status: 500 }
        );
      }
    } else {
      return Response.json(
        { error: "pdf_failed", detail: "No output method available from react-pdf" },
        { status: 500 }
      );
    }

    if (!out || out.length === 0) {
      return Response.json(
        { error: "pdf_failed", detail: "Empty PDF output" },
        { status: 500 }
      );
    }

    // ✅ Use native Response to avoid NextResponse BodyInit typing issues
    return new Response(out.buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compliance-reality-${score}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return Response.json(
      { error: "pdf_failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
