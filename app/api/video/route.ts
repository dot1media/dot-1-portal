import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureVideoSchema, videoKey, finalKey, currentClientEmail } from "@/lib/video";
import { presignGet, deleteObject } from "@/lib/r2";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId") || "";
  const reviewId = url.searchParams.get("reviewId") || "";
  await ensureVideoSchema();
  const reviews = (await sql`SELECT id, version, title, status, approved_at, client_email, final_uploaded, final_filename FROM video_reviews WHERE session_id = ${sessionId} AND uploaded = true ORDER BY version DESC`) as any[];
  if (!reviews.length) return NextResponse.json({ reviews: [], current: null, comments: [] });
  let ok = await hasStudio();
  if (!ok) { const em = await currentClientEmail(); ok = !!em && em === String(reviews[0].client_email || "").toLowerCase(); }
  if (!ok) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const cur = (reviewId ? reviews.find((r) => r.id === reviewId) : null) || reviews[0];
  const comments = (await sql`SELECT id, t, body, author FROM video_comments WHERE review_id = ${cur.id} ORDER BY t`) as any[];
  return NextResponse.json({
    reviews: reviews.map((r) => ({ id: r.id, version: r.version, title: r.title, status: r.status })),
    current: { id: cur.id, version: cur.version, title: cur.title, status: cur.status, playUrl: await presignGet(videoKey(cur.id), 10800), final: { available: !!cur.final_uploaded, filename: cur.final_filename || null } },
    comments: comments.map((c) => ({ id: c.id, t: Number(c.t) || 0, body: c.body, author: c.author })),
  });
}

export async function DELETE(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const reviewId = new URL(req.url).searchParams.get("reviewId") || "";
  if (!reviewId) return NextResponse.json({ error: "Missing review." }, { status: 400 });
  await ensureVideoSchema();
  await deleteObject(videoKey(reviewId));
  await deleteObject(finalKey(reviewId));
  await sql`DELETE FROM video_comments WHERE review_id = ${reviewId}`;
  await sql`DELETE FROM video_reviews WHERE id = ${reviewId}`;
  return NextResponse.json({ ok: true });
}
