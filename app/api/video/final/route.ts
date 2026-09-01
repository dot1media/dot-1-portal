import { NextResponse } from "next/server";
import { hasStudio } from "@/lib/studioGuard";
import { finalKey, reviewWithOwner, currentClientEmail } from "@/lib/video";
import { presignGet } from "@/lib/r2";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const reviewId = new URL(req.url).searchParams.get("reviewId") || "";
  const rv = await reviewWithOwner(reviewId);
  if (!rv || !rv.final_uploaded) return NextResponse.json({ error: "No final available." }, { status: 404 });
  let ok = await hasStudio();
  if (!ok) { const em = await currentClientEmail(); ok = !!em && em === String(rv.client_email || "").toLowerCase(); }
  if (!ok) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  return NextResponse.json({ url: await presignGet(finalKey(reviewId), 3600, rv.final_filename || "final.mp4") });
}
