import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const score = body?.score;

  if (typeof score !== "number" || score < 0 || score > 100) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  const hasDb =
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!hasDb) {
    return NextResponse.json({ avgScore: 0, n: 0 });
  }

  const { sql } = await import("@vercel/postgres");

  try {
    // 🔧 ONE-TIME BOOTSTRAP (safe to leave, but we'll remove it)
    await sql`
      create table if not exists submissions (
        id bigserial primary key,
        score int not null,
        created_at timestamptz not null default now()
      );
    `;

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
    return NextResponse.json({ avgScore: 0, n: 0 });
  }
}