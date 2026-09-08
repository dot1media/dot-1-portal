import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
export const runtime = "nodejs";
export async function POST() {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const r = ((await sql`SELECT data FROM availability_template WHERE id = 1`) as any[])[0];
  const t: any = r?.data; if (!t) return NextResponse.json({ error: "Save a weekly template first." }, { status: 400 });
  try { await sql`ALTER TABLE availability ADD COLUMN IF NOT EXISTS service_ids JSONB`; } catch {}
  const existing = new Set(((await sql`SELECT to_char(date, 'YYYY-MM-DD') AS d FROM availability`) as any[]).map((x) => x.d));
  const black = new Set((t.blackouts || []).map(String));
  const ids = JSON.stringify(Array.isArray(t.serviceIds) ? t.serviceIds : []);
  const weeks = Math.max(1, Math.min(26, Number(t.horizonWeeks) || 8));
  let opened = 0, skipped = 0;
  const n = new Date(); const start = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
  for (let off = 1; off <= weeks * 7; off++) {
    const dt = new Date(start + off * 86400000);
    const ds = dt.toISOString().slice(0, 10);
    const cfg = (t.weekly || {})[String(dt.getUTCDay())];
    if (!cfg || !cfg.on) continue;
    if (black.has(ds) || existing.has(ds)) { skipped++; continue; }
    if (!/^\d{2}:\d{2}$/.test(cfg.start) || !/^\d{2}:\d{2}$/.test(cfg.end) || cfg.start >= cfg.end) { skipped++; continue; }
    await sql`INSERT INTO availability (date, start_time, end_time, service_ids) VALUES (${ds}::date, ${cfg.start}::time, ${cfg.end}::time, ${ids}::jsonb)`;
    opened++;
  }
  return NextResponse.json({ ok: true, opened, skipped, weeks });
}
