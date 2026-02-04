import React from "react";
import { NextResponse } from "next/server";
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

function toUint8Array(maybe: unknown): Uint8Array {
  // Buffer (Node)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyVal: any = maybe;

  if (!anyVal) return new Uint8Array();

  // If it's already Uint8Array/Buffer-like
  if (anyVal instanceof Uint8Array) return anyVal;

  // If it's an ArrayBuffer
  if (anyVal instanceof ArrayBuffer) return new Uint8Array(anyVal);

  // If it looks like a Buffer (without importing Buffer types)
  if (typeof anyVal?.byteLength === "number" && typeof anyVal?.slice === "function") {
    try {
      return new Uint8Array(anyVal);
    } catch {
      // fallthrough
    }
  }

  // Last resort: empty
  return new Uint8Array();
}

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

    let out: Uint8Array;

    // Prefer toBuffer when available
    if (instance.toBuffer) {
      const maybe = await instance.toBuffer();
      // If this came back as a ReadableStream (some typings / runtimes), handle it
      if (maybe && typeof (maybe as any)?.getReader === "function") {
        out = await readableStreamToUint8Array(maybe as ReadableStream<Uint8Array>);
      } else {
        out = toUint8Array(maybe);
      }
    } else if (instance.toStream) {
      const maybeStream = await instance.toStream();
      // If it’s a Web ReadableStream, buffer it
      if (maybeStream && typeof (maybeStream as any)?.getReader === "function") {
        out = await readableStreamToUint8Array(
          maybeStream as ReadableStream<Uint8Array>
        );
      } else {
        // Node stream (rare here) — bail with a clear error
        return NextResponse.json(
          { error: "pdf_failed", detail: "Unsupported stream type from react-pdf" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "pdf_failed", detail: "No output method available from react-pdf" },
        { status: 500 }
      );
    }

    if (!out || out.length === 0) {
      return NextResponse.json(
        { error: "pdf_failed", detail: "Empty PDF output" },
        { status: 500 }
      );
    }

    return new NextResponse(out, {
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
