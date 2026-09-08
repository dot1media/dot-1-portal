import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { currentClientEmail } from "@/lib/gallery";
export const runtime = "nodejs";
const FIELDS = ["locations", "style", "people", "accessibility", "notes", "phone"] as const;
async function ensure() { await sql`CREATE TABLE IF NOT EXISTS client_profiles (client_email TEXT PRIMARY KEY, data JSONB DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ DEFAULT now())`; }
export async function GET(req: Request) {
  await ensure();
  const admin = await hasStudio();
  const q = String(new URL(req.url).searchParams.get("email") || "").toLowerCase().trim();
  const em = admin && q ? q : await currentClientEmail();
  if (!em) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const r = ((await sql`SELECT data, updated_at FROM client_profiles WHERE client_email = ${em} LIMIT 1`) as any[])[0];
  return NextResponse.json({ profile: r?.data || {}, updatedAt: r?.updated_at || null });
}
export async function POST(req: Request) {
  const em = await currentClientEmail();
  if (!em) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  await ensure();
  const b: any = await req.json().catch(() => ({}));
  const data: Record<string, string> = {};
  for (const k of FIELDS) if (k in (b.profile || {})) data[k] = String(b.profile[k] || "").slice(0, 2000);
  const cur = ((await sql`SELECT data FROM client_profiles WHERE client_email = ${em} LIMIT 1`) as any[])[0];
  const merged = { ...(cur?.data || {}), ...data };
  await sql`INSERT INTO client_profiles (client_email, data, updated_at) VALUES (${em}, ${JSON.stringify(merged)}::jsonb, now()) ON CONFLICT (client_email) DO UPDATE SET data = ${JSON.stringify(merged)}::jsonb, updated_at = now()`;
  return NextResponse.json({ ok: true, profile: merged });
}
