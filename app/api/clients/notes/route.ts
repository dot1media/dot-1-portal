import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
export const runtime = "nodejs";
async function ensure() { await sql`CREATE TABLE IF NOT EXISTS client_notes (client_email TEXT PRIMARY KEY, tags JSONB DEFAULT '[]'::jsonb, note TEXT DEFAULT '', updated_at TIMESTAMPTZ DEFAULT now())`; }
export async function GET(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const email = String(new URL(req.url).searchParams.get("email") || "").toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "Missing email." }, { status: 400 });
  await ensure();
  const r = ((await sql`SELECT tags, note FROM client_notes WHERE client_email = ${email} LIMIT 1`) as any[])[0];
  const sessions = ((await sql`SELECT COUNT(*)::int AS n FROM portal_sessions WHERE lower(client_email) = ${email} AND status IS DISTINCT FROM 'cancelled'`) as any[])[0];
  return NextResponse.json({ tags: Array.isArray(r?.tags) ? r.tags : [], note: r?.note || "", sessionCount: Number(sessions?.n) || 0 });
}
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b: any = await req.json().catch(() => ({}));
  const email = String(b.email || "").toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "Missing email." }, { status: 400 });
  await ensure();
  const tags = Array.isArray(b.tags) ? Array.from(new Set(b.tags.map((t: any) => String(t).trim()).filter(Boolean))).slice(0, 20) : [];
  const note = String(b.note || "").slice(0, 4000);
  await sql`INSERT INTO client_notes (client_email, tags, note, updated_at) VALUES (${email}, ${JSON.stringify(tags)}::jsonb, ${note}, now()) ON CONFLICT (client_email) DO UPDATE SET tags = ${JSON.stringify(tags)}::jsonb, note = ${note}, updated_at = now()`;
  return NextResponse.json({ ok: true, tags, note });
}
