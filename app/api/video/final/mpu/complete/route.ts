import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { finalKey, reviewWithOwner, ensureVideoSchema } from "@/lib/video";
import { completeMultipart, abortMultipart } from "@/lib/r2";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b: any = await req.json().catch(() => ({}));
  const reviewId = String(b.reviewId || "");
  const uploadId = String(b.uploadId || "");
  const parts = Array.isArray(b.parts) ? b.parts.map((p: any) => ({ PartNumber: Number(p.PartNumber), ETag: String(p.ETag) })).filter((p: any) => p.PartNumber && p.ETag) : [];
  const rv = await reviewWithOwner(reviewId);
  if (!rv || !uploadId || !parts.length) return NextResponse.json({ error: "Missing data." }, { status: 400 });
  const key = finalKey(reviewId);
  try { await completeMultipart(key, uploadId, parts); }
  catch (e: any) { await abortMultipart(key, uploadId); return NextResponse.json({ error: "Could not complete the upload." }, { status: 500 }); }
  await ensureVideoSchema();
  await sql`UPDATE video_reviews SET final_uploaded = true, final_filename = ${String(b.filename || "final.mp4")} WHERE id = ${reviewId}`;
  return NextResponse.json({ ok: true });
}
