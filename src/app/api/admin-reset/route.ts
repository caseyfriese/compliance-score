import { NextResponse } from "next/server";
import { Pool } from "pg";

let pool: Pool | null = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 2,
  });

  return pool;
}

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  const expected = process.env.ADMIN_RESET_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const p = getPool();
  if (!p) return NextResponse.json({ error: "db not configured" }, { status: 500 });

  try {
    // Ensure table exists, then truncate
    await p.query(`
      create table if not exists submissions (
        id bigserial primary key,
        score int not null,
        created_at timestamptz not null default now()
      );
    `);

    await p.query(`truncate table submissions;`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "reset failed" }, { status: 500 });
  }
}
