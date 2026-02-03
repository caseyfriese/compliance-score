"use client";

import React, { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { QUESTIONS, bandMicrocopy, scoreAnswers, verdict } from "@/lib/scoring";

type SubmitResp = { avgScore: number; n: number };

export default function ScorePage() {
  const [answers, setAnswers] = useState<boolean[]>(Array(6).fill(false));
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [avg, setAvg] = useState<number | null>(null);
  const [n, setN] = useState<number | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const score = useMemo(() => scoreAnswers(answers), [answers]);
  const v = useMemo(() => verdict(score), [score]);

  const cardRef = useRef<HTMLDivElement | null>(null);

  const toggle = (i: number, val: boolean) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ score }),
      });

      // Robust: handle non-JSON responses (e.g., dev without DB)
      const text = await res.text();
      let data: Partial<SubmitResp> = {};
      try {
        data = text ? (JSON.parse(text) as SubmitResp) : {};
      } catch {
        data = {};
      }

      setAvg(typeof data.avgScore === "number" ? data.avgScore : null);
      setN(typeof data.n === "number" ? data.n : null);
      setSubmitted(true);
    } finally {
      setBusy(false);
    }
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `compliance-score-${score}.png`;
    a.click();
  };

  return (
    <main
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "system-ui",
      }}
    >
      {!submitted ? (
        <>
          <h1 style={{ fontSize: 34, marginBottom: 6 }}>Answer yes or no.</h1>
          <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 22 }}>
            No explanations. No caveats.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {QUESTIONS.map((q, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid rgba(0,0,0,0.10)",
                  borderRadius: 14,
                  padding: 16,
                  background: "#fff",
                }}
              >
                <div style={{ fontSize: 16, lineHeight: 1.35, marginBottom: 10 }}>
                  {q}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => toggle(i, true)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: answers[i] ? "2px solid #111" : "1px solid rgba(0,0,0,0.15)",
                      background: answers[i] ? "#111" : "#fff",
                      color: answers[i] ? "#fff" : "#111",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Yes
                  </button>

                  <button
                    type="button"
                    onClick={() => toggle(i, false)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: !answers[i] ? "2px solid #111" : "1px solid rgba(0,0,0,0.15)",
                      background: !answers[i] ? "#111" : "#fff",
                      color: !answers[i] ? "#fff" : "#111",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    No
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: "#111",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {busy ? "Scoring…" : "See my score"}
            </button>

            <div style={{ fontSize: 13, opacity: 0.65 }}>{bandMicrocopy()}</div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
            <div
              ref={cardRef}
              style={{
                width: "100%",
                maxWidth: 520,
                borderRadius: 18,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#fff",
                padding: 24,
              }}
            >
              <div style={{ fontSize: 12, letterSpacing: 1.2, opacity: 0.65 }}>
                COMPLIANCE THEATER SCORE
              </div>

              <div style={{ fontSize: 72, fontWeight: 800, marginTop: 8, lineHeight: 1 }}>
                {score} / 100
              </div>

              <div style={{ fontSize: 18, fontWeight: 650, marginTop: 10 }}>{v}</div>

              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 10 }}>{bandMicrocopy()}</div>

              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 18 }}>
                Measured in minutes. Not binders.
              </div>
            </div>

            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#fff",
                padding: 18,
                maxWidth: 520,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>How you compare</div>

              <Bar label="Your score" value={score} />
              <div style={{ height: 10 }} />
              <Bar label="Org average (30d)" value={avg ?? 0} />

              <div style={{ marginTop: 12, fontSize: 13, opacity: 0.7 }}>
                Teams tend to score slightly higher than individuals — not because controls work better, but because gaps are distributed.
              </div>

              {typeof n === "number" && n > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.55 }}>
                  Benchmark based on {n} anonymous submissions in the last 30 days.
                </div>
              )}
            </div>

            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#fff",
                padding: 18,
                maxWidth: 520,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800 }}>Want to know where the gaps actually are?</div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
                Get a one-page breakdown of which answers impacted your score most and what operational teams typically address first.
              </div>

              <button
                type="button"
                onClick={() => alert("Wire this to email capture or Stripe later. Keep it soft.")}
                style={{
                  marginTop: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Get the 1-page Reality Breakdown
              </button>

              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                Delivered as a short PDF. No mailing lists. No demos.
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={downloadCard}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "none",
                  background: "#111",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Download share card (PNG)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setAvg(null);
                  setN(null);
                }}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Retake
              </button>
            </div>

            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>
              Built by an active security &amp; compliance operator.
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.75 }}>
        <span>{label}</span>
        <span>{v}</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(0,0,0,0.08)", overflow: "hidden", marginTop: 6 }}>
        <div style={{ width: `${v}%`, height: "100%", background: "#111" }} />
      </div>
    </div>
  );
}