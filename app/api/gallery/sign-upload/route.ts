import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureGallerySchema, keyThumb, keyProof, keyFull, newId } from "@/lib/gallery";
import { presignPut, r2Configured } from "@/lib/r2";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (!r2Configured()) return NextResponse.json({ error: "R2 storage is not configured." }, { status: 400 });
  const b: any = await req.json().catch(() => ({}));
  const files = Array.isArray(b.files) ? b.files.slice(0, 500) : [];
  if (!files.length) return NextResponse.json({ error: "No files." }, { status: 400 });
  await ensureGallerySchema();
  let galleryId = b.galleryId ? String(b.galleryId) : "";
  if (!galleryId) {
    galleryId = newId("g_");
    let clientEmail = String(b.clientEmail || "").toLowerCase();
    if (!clientEmail && b.sessionId) { const r = (await sql`SELECT client_email FROM portal_sessions WHERE id = ${String(b.sessionId)} LIMIT 1`) as any[]; clientEmail = String(r[0]?.client_email || "").toLowerCase(); }
    const inc = b.included != null && String(b.included).trim() !== "" ? parseInt(String(b.included), 10) : null;
    await sql`INSERT INTO galleries (id, session_id, client_email, title, included) VALUES (${galleryId}, ${b.sessionId ? String(b.sessionId) : null}, ${clientEmail || null}, ${b.title || null}, ${Number.isNaN(inc as any) ? null : inc})`;
  }
  const uploads = [];
  for (const f of files) {
    const pid = newId("p_");
    uploads.push({ id: pid, name: String(f.name || "photo.jpg"),
      thumbUrl: await presignPut(keyThumb(galleryId, pid), "image/jpeg"),
      proofUrl: await presignPut(keyProof(galleryId, pid), "image/jpeg"),
      fullUrl: await presignPut(keyFull(galleryId, pid), String(f.type || "image/jpeg")) });
  }
  return NextResponse.json({ galleryId, uploads });
}
