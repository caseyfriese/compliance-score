import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const score = body?.score;

  if (typeof score !== "number" || score < 0 || score > 100) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  // Try DB only if environment is configured.
  // In dev (Codespaces), you probably don't have Vercel Postgres env vars yet.
  const hasDb =
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!hasDb) {
    // Dev fallback: no DB, no benchmark.
    return NextResponse.json({ avgScore: 0, n: 0 });
  }

  // Import only when DB exists, to avoid runtime failures
  const { sql } = await import("@vercel/postgres");

  try {
    await sql`insert into submissions (score) values (${score});`;

    const { rows } = await sql`
      select
        coalesce(round(avg(score))::int, 0) as avg_score,
        count(*)::int as n
      from submissions
      where created_at >= now() - interval '30 days';
    `;

    return NextResponse.json({
      avgScore: rows?.[0]?.avg_score ?? 0,
      n: rows?.[0]?.n ?? 0,
    });
  } catch (e) {
    // If the DB exists but table isn't created yet, still return JSON
    return NextResponse.json({ avgScore: 0, n: 0 });
  }
}