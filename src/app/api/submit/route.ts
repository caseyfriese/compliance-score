import { NextResponse } from "next/server";
import { Pool } from "pg";

let pool: Pool | null = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) return null;

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // safe default for managed PG
    max: 5,
  });

  return pool;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const score = body?.score;

  if (typeof score !== "number" || score < 0 || score > 100) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  const p = getPool();
  if (!p) {
    // DB not connected to this deployment yet (env vars missing)
    return NextResponse.json({ avgScore: 0, n: 0 });
  }

  try {
    // One-time bootstrap (idempotent)
    await p.query(`
      create table if not exists submissions (
        id bigserial primary key,
        score int not null,
        created_at timestamptz not null default now()
      );
    `);

    await p.query(`insert into submissions (score) values ($1);`, [score]);

    const { rows } = await p.query(`
      select
        coalesce(round(avg(score))::int, 0) as avg_score,
        count(*)::int as n
      from submissions
      where created_at >= now() - interval '30 days';
    `);

    return NextResponse.json({
      avgScore: rows?.[0]?.avg_score ?? 0,
      n: rows?.[0]?.n ?? 0,
    });
  } catch (e) {
    // Keep the UI stable even if DB throws
    return NextResponse.json({ avgScore: 0, n: 0 });
  }
}
