import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureGallerySchema, keyThumb, currentClientEmail } from "@/lib/gallery";
import { presignGet } from "@/lib/r2";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId") || "";
  const galleryId = url.searchParams.get("galleryId") || "";
  await ensureGallerySchema();
  let g: any = null;
  if (galleryId) g = ((await sql`SELECT * FROM galleries WHERE id = ${galleryId} LIMIT 1`) as any[])[0];
  else if (sessionId) g = ((await sql`SELECT * FROM galleries WHERE session_id = ${sessionId} ORDER BY created_at DESC LIMIT 1`) as any[])[0];
  if (!g) return NextResponse.json({ gallery: null, photos: [] });
  let ok = await hasStudio();
  if (!ok) { const em = await currentClientEmail(); ok = !!em && em === String(g.client_email || "").toLowerCase(); }
  if (!ok) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const photos = (await sql`SELECT id, filename, favorite, sort FROM gallery_photos WHERE gallery_id = ${g.id} ORDER BY sort, created_at`) as any[];
  const selectedCount = photos.filter((p) => p.favorite).length;
  const out = await Promise.all(photos.map(async (p) => ({ id: p.id, filename: p.filename, favorite: p.favorite, thumb: await presignGet(keyThumb(g.id, p.id), 21600) })));
  return NextResponse.json({ gallery: { id: g.id, title: g.title, count: out.length, included: g.included ?? null, selectedCount }, photos: out });
}
