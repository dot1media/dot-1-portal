import { NextResponse } from "next/server";
import { hasStudio } from "@/lib/studioGuard";
import { finalKey, reviewWithOwner } from "@/lib/video";
import { presignPut, r2Configured } from "@/lib/r2";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (!r2Configured()) return NextResponse.json({ error: "R2 storage is not configured." }, { status: 400 });
  const b: any = await req.json().catch(() => ({}));
  const reviewId = String(b.reviewId || "");
  const rv = await reviewWithOwner(reviewId);
  if (!rv) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ url: await presignPut(finalKey(reviewId), String(b.type || "video/mp4"), 21600) });
}
