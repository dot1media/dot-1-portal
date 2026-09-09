import { NextResponse } from "next/server";
import * as sharpMod from "sharp";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureGallerySchema, keyThumb, keyProof, keyFull } from "@/lib/gallery";
import { getObjectStream, putObject } from "@/lib/r2";
export const runtime = "nodejs";
export const maxDuration = 60;
const sharp: any = (sharpMod as any).default || sharpMod;
async function toBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> { const chunks: Buffer[] = []; for await (const c of stream as any) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)); return Buffer.concat(chunks); }
// Rebuild thumb (900px) + proof (2048px) from the stored original, in batches so large galleries finish across calls.
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b: any = await req.json().catch(() => ({}));
  const galleryId = String(b.galleryId || ""); const offset = Math.max(0, parseInt(String(b.offset), 10) || 0); const batch = 12;
  if (!galleryId) return NextResponse.json({ error: "Missing gallery." }, { status: 400 });
  await ensureGallerySchema();
  const total = Number(((await sql`SELECT COUNT(*)::int AS n FROM gallery_photos WHERE gallery_id = ${galleryId}`) as any[])[0]?.n) || 0;
  const photos = (await sql`SELECT id FROM gallery_photos WHERE gallery_id = ${galleryId} ORDER BY sort ASC, created_at ASC OFFSET ${offset} LIMIT ${batch}`) as any[];
  let done = 0, failed = 0;
  for (const p of photos) {
    try {
      const { body } = await getObjectStream(keyFull(galleryId, p.id));
      const src = await toBuffer(body);
      const base = sharp(src, { failOn: "none" }).rotate();
      const thumb = await base.clone().resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
      const proof = await base.clone().resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
      await putObject(keyThumb(galleryId, p.id), thumb, "image/jpeg");
      await putObject(keyProof(galleryId, p.id), proof, "image/jpeg");
      done++;
    } catch { failed++; }
  }
  const next = offset + photos.length;
  return NextResponse.json({ ok: true, done, failed, next, total, finished: next >= total });
}
