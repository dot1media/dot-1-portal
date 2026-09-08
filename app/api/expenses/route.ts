import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
export const runtime = "nodejs";
async function ensure() { await sql`CREATE TABLE IF NOT EXISTS session_expenses (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, label TEXT NOT NULL, category TEXT DEFAULT 'other', amount_cents INT NOT NULL, spent_on DATE, created_at TIMESTAMPTZ DEFAULT now())`; await sql`CREATE INDEX IF NOT EXISTS session_expenses_sid ON session_expenses (session_id)`; }
export async function GET(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensure();
  const sid = new URL(req.url).searchParams.get("sessionId") || "";
  if (sid) { const rows = (await sql`SELECT id, label, category, amount_cents, spent_on, created_at FROM session_expenses WHERE session_id = ${sid} ORDER BY created_at ASC`) as any[]; return NextResponse.json({ expenses: rows, total: rows.reduce((a, r) => a + (Number(r.amount_cents) || 0), 0) / 100 }); }
  const agg = (await sql`SELECT session_id, SUM(amount_cents)::int AS cents FROM session_expenses GROUP BY session_id`) as any[];
  const bySession: Record<string, number> = {}; for (const r of agg) bySession[r.session_id] = (Number(r.cents) || 0) / 100;
  return NextResponse.json({ bySession, total: Object.values(bySession).reduce((a, b) => a + b, 0) });
}
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensure();
  const b: any = await req.json().catch(() => ({}));
  const sid = String(b.sessionId || ""), label = String(b.label || "").trim().slice(0, 160), amount = Math.round((Number(b.amount) || 0) * 100);
  if (!sid || !label || amount <= 0) return NextResponse.json({ error: "Label and a positive amount are required." }, { status: 400 });
  const id = "ex_" + Math.random().toString(36).slice(2, 10);
  await sql`INSERT INTO session_expenses (id, session_id, label, category, amount_cents, spent_on) VALUES (${id}, ${sid}, ${label}, ${String(b.category || "other")}, ${amount}, ${b.spentOn ? String(b.spentOn) : null})`;
  return NextResponse.json({ ok: true, id });
}
export async function DELETE(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensure();
  const id = new URL(req.url).searchParams.get("id") || ""; if (id) await sql`DELETE FROM session_expenses WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
