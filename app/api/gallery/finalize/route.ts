import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureGallerySchema } from "@/lib/gallery";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b: any = await req.json().catch(() => ({}));
  const galleryId = String(b.galleryId || "");
  const photos = Array.isArray(b.photos) ? b.photos : [];
  if (!galleryId || !photos.length) return NextResponse.json({ error: "Missing data." }, { status: 400 });
  await ensureGallerySchema();
  const mx = (await sql`SELECT COALESCE(MAX(sort), -1) AS m FROM gallery_photos WHERE gallery_id = ${galleryId}`) as any[];
  let sort = Number(mx[0]?.m ?? -1) + 1;
  for (const p of photos) { await sql`INSERT INTO gallery_photos (id, gallery_id, filename, sort) VALUES (${String(p.id)}, ${galleryId}, ${String(p.name || "")}, ${sort}) ON CONFLICT (id) DO NOTHING`; sort++; }
  const cnt = (await sql`SELECT COUNT(*)::int AS n FROM gallery_photos WHERE gallery_id = ${galleryId}`) as any[];
  return NextResponse.json({ ok: true, galleryId, count: Number(cnt[0]?.n) || 0 });
}
