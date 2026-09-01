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
  await sql`UPDATE gallery_photos SET favorite = ${fav} WHERE id = ${photoId}`;
  return NextResponse.json({ ok: true, favorite: fav });
}
