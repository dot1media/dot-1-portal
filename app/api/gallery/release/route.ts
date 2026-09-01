import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureGallerySchema, currentClientEmail } from "@/lib/gallery";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const b: any = await req.json().catch(() => ({}));
  const galleryId = String(b.galleryId || "");
  if (!galleryId) return NextResponse.json({ error: "Missing gallery." }, { status: 400 });
  await ensureGallerySchema();
  const g = ((await sql`SELECT id, client_email, release_locked FROM galleries WHERE id = ${galleryId} LIMIT 1`) as any[])[0];
  if (!g) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const admin = await hasStudio();
  let ok = admin;
  if (!ok) { const em = await currentClientEmail(); ok = !!em && em === String(g.client_email || "").toLowerCase(); }
  if (!ok) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (b.unlock && admin) { await sql`UPDATE galleries SET release_locked = false WHERE id = ${galleryId}`; return NextResponse.json({ ok: true, unlocked: true }); }
  if (!admin && g.release_locked) return NextResponse.json({ error: "Your model release is already saved. Please contact the studio to change it.", locked: true }, { status: 409 });
  const rel = {
    portfolio: !!(b.release && b.release.portfolio),
    social: !!(b.release && b.release.social),
    advertising: !!(b.release && b.release.advertising),
    updatedAt: new Date().toISOString(),
  };
  if (!admin) await sql`UPDATE galleries SET release = ${JSON.stringify(rel)}::jsonb, release_locked = true WHERE id = ${galleryId}`;
  else await sql`UPDATE galleries SET release = ${JSON.stringify(rel)}::jsonb WHERE id = ${galleryId}`;
  return NextResponse.json({ ok: true, release: rel, locked: !admin });
}
