import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { reviewWithOwner, currentClientEmail } from "@/lib/video";
import { sendEmail } from "@/lib/email";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const b: any = await req.json().catch(() => ({}));
  const reviewId = String(b.reviewId || "");
  if (!reviewId) return NextResponse.json({ error: "Missing review." }, { status: 400 });
  const rv = await reviewWithOwner(reviewId);
  if (!rv) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const admin = await hasStudio();
  let ok = admin, who = "studio";
  if (!ok) { const em = await currentClientEmail(); ok = !!em && em === String(rv.client_email || "").toLowerCase(); who = em; }
  if (!ok) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await sql`UPDATE video_reviews SET status = 'approved', approved_at = now() WHERE id = ${reviewId}`;
  if (!admin) { try { await sendEmail({ to: "contact@dot1.media", subject: "Approved: " + (rv.title || "video cut"), html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#33322d"><p><b>${who}</b> approved <b>${rv.title || "the cut"}</b>. This version is locked.</p></div>`, replyTo: rv.client_email || undefined }); } catch (e) {} }
  return NextResponse.json({ ok: true });
}
