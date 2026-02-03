"use client";

import React, { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { QUESTIONS, bandMicrocopy, scoreAnswers, verdict } from "@/lib/scoring";

type SubmitResp = { avgScore: number; n: number };

export default function ScorePage() {
  const [answers, setAnswers] = useState<boolean[]>(Array(6).fill(false));
  const [submitted, setSubmitted] = useState(false);
  const [avg, setAvg] = useState<number | null>(null);
  const [n, setN] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

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
    <main className="container">
      {!submitted ? (
        <div className="stack">
          <div className="card">
            <div className="kicker">Answer yes or no</div>
            <h1 className="h1" style={{ marginTop: 10, fontSize: 38 }}>
              No explanations. No caveats.
            </h1>
            <p className="sub" style={{ marginBottom: 0 }}>
              If this feels “unfair,” that’s usually the point.
            </p>
          </div>

          <div className="stack">
            {QUESTIONS.map((q, i) => (
              <div className="card tight" key={i}>
                <div style={{ fontSize: 16, lineHeight: 1.35, fontWeight: 650 }}>
                  {q}
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                  <div className="pillGroup">
                    <button
                      type="button"
                      className={`pill ${answers[i] ? "active" : ""}`}
                      onClick={() => toggle(i, true)}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`pill ${!answers[i] ? "active" : ""}`}
                      onClick={() => toggle(i, false)}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="row">
              <button
                type="button"
                className="btn btnPrimary"
                onClick={submit}
                disabled={busy}
              >
                {busy ? "Scoring…" : "See my score"}
              </button>

              <div className="smallNote">{bandMicrocopy()}</div>
            </div>

            <div className="footerLine">
              Tip: screenshot the result or download the share card.
            </div>
          </div>
        </div>
      ) : (
        <div className="stack">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="smallNote">Your result</div>
            <button type="button" className="btn" onClick={() => location.reload()}>
              New run
            </button>
          </div>

          {/* Share card */}
          <div className="card" ref={cardRef} style={{ maxWidth: 560 }}>
            <div className="kicker">Compliance theater score</div>
            <div className="bigScore">{score} / 100</div>
            <div className="verdict">{v}</div>
            <div className="micro">{bandMicrocopy()}</div>
            <div className="footerLine">Measured in minutes. Not binders.</div>
          </div>

          {/* Comparison */}
          <div className="card" style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>
              How you compare
            </div>

            <Bar label="Your score" value={score} />
            <div style={{ height: 10 }} />
            <Bar label="Org average (30d)" value={avg ?? 0} />

            <div className="micro" style={{ marginTop: 12 }}>
              Teams tend to score slightly higher than individuals — not because controls work better,
              but because gaps are distributed.
            </div>

            {typeof n === "number" && (
              <div className="smallNote" style={{ marginTop: 8 }}>
                Benchmark based on {n} anonymous submissions in the last 30 days.
              </div>
            )}
          </div>

          {/* Subtle lead CTA */}
          <div className="card" style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 16, fontWeight: 850 }}>
              Want to know where the gaps actually are?
            </div>
            <div className="micro">
              Get a one-page breakdown of which answers impacted your score most and what operational teams typically address first.
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn"
                onClick={() => alert("Wire this to PDF delivery later (email or Stripe). Keep it soft.")}
              >
                Get the 1-page Reality Breakdown
              </button>
              <span className="smallNote">No mailing lists. No demos.</span>
            </div>
          </div>

          <div className="row">
            <button type="button" className="btn btnPrimary" onClick={downloadCard}>
              Download share card (PNG)
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => {
                setSubmitted(false);
                setAvg(null);
                setN(null);
              }}
            >
              Retake
            </button>
          </div>

          <div className="smallNote">Built by an active security &amp; compliance operator.</div>
        </div>
      )}
    </main>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)" }}>
        <span>{label}</span>
        <span>{v}</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginTop: 6 }}>
        <div style={{ width: `${v}%`, height: "100%", background: "rgba(255,255,255,0.86)" }} />
      </div>
    </div>
  );
}
