import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
export const runtime = "nodejs";
async function ensure() { await sql`CREATE TABLE IF NOT EXISTS availability_template (id INT PRIMARY KEY, data JSONB, updated_at TIMESTAMPTZ DEFAULT now())`; }
const DEFAULT = { weekly: { "0": { on: false, start: "09:00", end: "17:00" }, "1": { on: false, start: "09:00", end: "17:00" }, "2": { on: false, start: "09:00", end: "17:00" }, "3": { on: false, start: "09:00", end: "17:00" }, "4": { on: false, start: "09:00", end: "17:00" }, "5": { on: false, start: "09:00", end: "17:00" }, "6": { on: false, start: "09:00", end: "17:00" } }, blackouts: [], serviceIds: [], horizonWeeks: 8 };
export async function GET() {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensure();
  const r = ((await sql`SELECT data FROM availability_template WHERE id = 1`) as any[])[0];
  return NextResponse.json({ template: { ...DEFAULT, ...(r?.data || {}) } });
}
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b: any = await req.json().catch(() => ({}));
  await ensure();
  const t = { ...DEFAULT, ...(b.template || {}) };
  t.blackouts = Array.isArray(t.blackouts) ? t.blackouts.filter((x: any) => /^\d{4}-\d{2}-\d{2}$/.test(String(x))) : [];
  t.serviceIds = Array.isArray(t.serviceIds) ? t.serviceIds.map((x: any) => parseInt(String(x), 10)).filter((n: number) => !isNaN(n)) : [];
  t.horizonWeeks = Math.max(1, Math.min(26, parseInt(String(t.horizonWeeks), 10) || 8));
  await sql`INSERT INTO availability_template (id, data, updated_at) VALUES (1, ${JSON.stringify(t)}::jsonb, now()) ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(t)}::jsonb, updated_at = now()`;
  return NextResponse.json({ ok: true, template: t });
}
