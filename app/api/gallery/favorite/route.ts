import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { photoWithOwner, currentClientEmail } from "@/lib/gallery";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const b: any = await req.json().catch(() => ({}));
  const photoId = String(b.photoId || "");
  if (!photoId) return NextResponse.json({ error: "Missing photo." }, { status: 400 });
  const p = await photoWithOwner(photoId);
  if (!p) return NextResponse.json({ error: "Not found." }, { status: 404 });
  let ok = await hasStudio();
  if (!ok) { const em = await currentClientEmail(); ok = !!em && em === String(p.client_email || "").toLowerCase(); }
  if (!ok) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const fav = b.favorite === undefined ? !p.favorite : !!b.favorite;
  if (fav && !p.favorite) {
    const g = ((await sql`SELECT included FROM galleries WHERE id = ${p.gallery_id} LIMIT 1`) as any[])[0];
    const inc = g?.included;
    if (inc != null) {
      const c = ((await sql`SELECT COUNT(*)::int AS n FROM gallery_photos WHERE gallery_id = ${p.gallery_id} AND favorite = true`) as any[])[0];
      if (Number(c?.n || 0) >= Number(inc)) return NextResponse.json({ error: "You have selected all " + inc + " of your included photos.", limit: true, included: Number(inc) }, { status: 409 });
    }
  }
  await sql`UPDATE gallery_photos SET favorite = ${fav} WHERE id = ${photoId}`;
  return NextResponse.json({ ok: true, favorite: fav });
}
