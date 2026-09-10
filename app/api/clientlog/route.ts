import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
export const runtime = "nodejs";
async function ensure() { await sql`CREATE TABLE IF NOT EXISTS client_errors (id SERIAL PRIMARY KEY, msg TEXT, stack TEXT, url TEXT, ua TEXT, at TIMESTAMPTZ DEFAULT now())`; }
export async function POST(req: Request) {
  try { await ensure(); const b: any = await req.json().catch(() => ({}));
    await sql`INSERT INTO client_errors (msg, stack, url, ua) VALUES (${String(b.msg || "").slice(0, 500)}, ${String(b.stack || "").slice(0, 4000)}, ${String(b.url || "").slice(0, 300)}, ${String(b.ua || "").slice(0, 300)})`;
    await sql`DELETE FROM client_errors WHERE id NOT IN (SELECT id FROM client_errors ORDER BY at DESC LIMIT 50)`;
  } catch {}
  return NextResponse.json({ ok: true });
}
export async function GET() {
  try { await ensure(); const rows = (await sql`SELECT msg, stack, url, at FROM client_errors ORDER BY at DESC LIMIT 10`) as any[]; return NextResponse.json({ errors: rows }); } catch (e: any) { return NextResponse.json({ error: String(e?.message || e) }); }
}
