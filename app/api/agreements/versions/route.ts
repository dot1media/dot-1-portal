import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { CLIENT_SERVICES_VERSION, RELEASE_VERSION } from "@/lib/portal/constants";
export const runtime = "nodejs";
const DEFAULTS: Record<string, string> = { client_services: CLIENT_SERVICES_VERSION, media_release: RELEASE_VERSION, minor_release: RELEASE_VERSION };
async function ensure() { await sql`CREATE TABLE IF NOT EXISTS agreement_versions (doc_type TEXT PRIMARY KEY, version TEXT NOT NULL, note TEXT DEFAULT '', updated_at TIMESTAMPTZ DEFAULT now())`; }
async function current(): Promise<Record<string, { version: string; note: string }>> {
  await ensure();
  const rows = (await sql`SELECT doc_type, version, note FROM agreement_versions`) as any[];
  const out: Record<string, { version: string; note: string }> = {};
  for (const k of Object.keys(DEFAULTS)) out[k] = { version: DEFAULTS[k], note: "" };
  for (const r of rows) out[r.doc_type] = { version: r.version, note: r.note || "" };
  return out;
}
export async function GET() {
  const versions = await current();
  if (!(await hasStudio())) return NextResponse.json({ versions });
  // studio also gets who is outstanding: latest signed version per user+doc vs current
  const latest = (await sql`SELECT DISTINCT ON (a.user_id, a.agreement_type) a.user_id, a.agreement_type, a.version, u.email, u.name FROM agreements a JOIN users u ON u.id = a.user_id ORDER BY a.user_id, a.agreement_type, a.signed_at DESC`) as any[];
  const outstanding: Record<string, { email: string; name: string; signed: string }[]> = {};
  for (const r of latest) { const cur = versions[r.agreement_type]; if (cur && String(r.version) !== String(cur.version)) (outstanding[r.agreement_type] ||= []).push({ email: r.email, name: r.name || "", signed: r.version }); }
  return NextResponse.json({ versions, outstanding });
}
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b: any = await req.json().catch(() => ({}));
  const doc = String(b.docType || ""); const version = String(b.version || "").trim().slice(0, 20); const note = String(b.note || "").slice(0, 1000);
  if (!(doc in DEFAULTS) || !version) return NextResponse.json({ error: "Document and version are required." }, { status: 400 });
  await ensure();
  await sql`INSERT INTO agreement_versions (doc_type, version, note, updated_at) VALUES (${doc}, ${version}, ${note}, now()) ON CONFLICT (doc_type) DO UPDATE SET version = ${version}, note = ${note}, updated_at = now()`;
  return NextResponse.json({ ok: true, versions: await current() });
}
