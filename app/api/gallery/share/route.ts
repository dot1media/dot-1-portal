import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureGallerySchema, currentClientEmail } from "@/lib/gallery";
import { PORTAL_ROOT } from "@/lib/portal/constants";
export const runtime = "nodejs";
async function ensure() { await sql`CREATE TABLE IF NOT EXISTS gallery_shares (token TEXT PRIMARY KEY, gallery_id TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`; }
async function owns(galleryId: string) {
  const g = ((await sql`SELECT id, client_email FROM galleries WHERE id = ${galleryId} LIMIT 1`) as any[])[0];
  if (!g) return null;
  if (await hasStudio()) return g;
  const em = await currentClientEmail();
  return em && em === String(g.client_email || "").toLowerCase() ? g : null;
}
export async function POST(req: Request) {
  const b: any = await req.json().catch(() => ({}));
  const galleryId = String(b.galleryId || ""); if (!galleryId) return NextResponse.json({ error: "Missing gallery." }, { status: 400 });
  await ensureGallerySchema(); await ensure();
  if (!(await owns(galleryId))) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  let row = ((await sql`SELECT token FROM gallery_shares WHERE gallery_id = ${galleryId} LIMIT 1`) as any[])[0];
  if (!row) { const token = "sh_" + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8); await sql`INSERT INTO gallery_shares (token, gallery_id) VALUES (${token}, ${galleryId})`; row = { token }; }
  return NextResponse.json({ ok: true, token: row.token, link: PORTAL_ROOT.replace(/\/$/, "") + "/share/" + row.token });
}
export async function DELETE(req: Request) {
  const galleryId = new URL(req.url).searchParams.get("galleryId") || "";
  await ensureGallerySchema(); await ensure();
  if (!galleryId || !(await owns(galleryId))) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await sql`DELETE FROM gallery_shares WHERE gallery_id = ${galleryId}`;
  return NextResponse.json({ ok: true });
}
