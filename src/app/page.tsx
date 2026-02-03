import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "56px 20px", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 44, lineHeight: 1.1, marginBottom: 12 }}>
        How much of your compliance actually works?
      </h1>
      <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 22 }}>
        A 60-second reality check for people responsible for risk.
      </p>

      <Link
        href="/score"
        style={{
          display: "inline-block",
          padding: "12px 16px",
          borderRadius: 12,
          background: "#111",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Get your score
      </Link>

      <div style={{ marginTop: 28, fontSize: 13, opacity: 0.65 }}>
        Built by an active security &amp; compliance operator.
      </div>
    </main>
  );
}