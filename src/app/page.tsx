import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <div className="card">
        <div className="kicker">Compliance theater score</div>
        <h1 className="h1" style={{ marginTop: 12 }}>
          How much of your compliance actually works?
        </h1>
        <p className="sub">
          A 60-second reality check for people responsible for risk.
        </p>

        <div className="row" style={{ marginTop: 6 }}>
          <Link
            className="btn btnPrimary"
            href="/score"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            Get your score
          </Link>

          <span className="smallNote">
            No frameworks. No email gate. No vendor pitch.
          </span>
        </div>

        <div className="hr" />

        <div className="smallNote">
          Built by an active security &amp; compliance operator.
        </div>
      </div>
    </main>
  );
}
