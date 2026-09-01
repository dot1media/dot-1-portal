import { NextResponse } from "next/server";
import { hasStudio } from "@/lib/studioGuard";
import { finalKey, reviewWithOwner } from "@/lib/video";
import { createMultipart, presignPart, r2Configured } from "@/lib/r2";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (!r2Configured()) return NextResponse.json({ error: "R2 not configured." }, { status: 400 });
  const b: any = await req.json().catch(() => ({}));
  const reviewId = String(b.reviewId || "");
  const parts = Math.max(1, Math.min(10000, parseInt(String(b.parts), 10) || 1));
  const rv = await reviewWithOwner(reviewId);
  if (!rv) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const key = finalKey(reviewId);
  const uploadId = await createMultipart(key, String(b.type || "video/mp4"));
  const urls: string[] = [];
  for (let n = 1; n <= parts; n++) urls.push(await presignPart(key, uploadId, n));
  return NextResponse.json({ uploadId, urls });
}
