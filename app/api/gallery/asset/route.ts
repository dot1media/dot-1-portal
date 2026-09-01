import { NextResponse } from "next/server";
import { hasStudio } from "@/lib/studioGuard";
import { photoWithOwner, currentClientEmail, keyProof, keyFull } from "@/lib/gallery";
import { presignGet } from "@/lib/r2";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const photoId = url.searchParams.get("photoId") || "";
  const size = url.searchParams.get("size") || "proof";
  if (!photoId) return NextResponse.json({ error: "Missing photo." }, { status: 400 });
  const p = await photoWithOwner(photoId);
  if (!p) return NextResponse.json({ error: "Not found." }, { status: 404 });
  let ok = await hasStudio();
  if (!ok) { const em = await currentClientEmail(); ok = !!em && em === String(p.client_email || "").toLowerCase(); }
  if (!ok) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const isFull = size === "full" || size === "download";
  const key = isFull ? keyFull(p.gallery_id, p.id) : keyProof(p.gallery_id, p.id);
  const dl = size === "download" ? (p.filename || "photo.jpg") : undefined;
  return NextResponse.json({ url: await presignGet(key, 3600, dl) });
}
