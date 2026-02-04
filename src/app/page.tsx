import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <div className="card">
        <div className="kicker">AI usage reality check</div>

        <h1 className="h1" style={{ marginTop: 12 }}>
          How risky is your AI use to your company?
        </h1>

        <p className="sub">
          A 60-second self-check based on how you actually use AI day to day — not
          how your policy says you should.
        </p>

        <div className="row" style={{ marginTop: 6 }}>
          <Link
            className="btn btnPrimary"
            href="/score"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            Check my AI risk
          </Link>

          <span className="smallNote">
            No frameworks. No email gate. No vendor pitch.
          </span>
        </div>

        <div className="hr" />

        <div className="smallNote">Built quietly by an operator.</div>
      </div>
    </main>
  );
}
