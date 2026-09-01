import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { reviewWithOwner, currentClientEmail, newId } from "@/lib/video";
import { sendEmail } from "@/lib/email";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const b: any = await req.json().catch(() => ({}));
  const reviewId = String(b.reviewId || "");
  const body = String(b.body || "").trim();
  const t = Math.max(0, Number(b.t) || 0);
  if (!reviewId || !body) return NextResponse.json({ error: "Missing note." }, { status: 400 });
  const rv = await reviewWithOwner(reviewId);
  if (!rv) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const admin = await hasStudio();
  let ok = admin;
  if (!ok) { const em = await currentClientEmail(); ok = !!em && em === String(rv.client_email || "").toLowerCase(); }
  if (!ok) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const id = newId("c_");
  await sql`INSERT INTO video_comments (id, review_id, t, body, author) VALUES (${id}, ${reviewId}, ${t}, ${body}, ${admin ? "studio" : "client"})`;
  if (!admin) { try { await sendEmail({ to: "contact@dot1.media", subject: "Video note on " + (rv.title || "a cut"), html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#33322d"><p>New note at ${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,"0")} on <b>${rv.title || "a cut"}</b>:</p><blockquote style="border-left:3px solid #e23b2e;padding-left:12px;color:#33322d">${body.replace(/</g,"&lt;")}</blockquote></div>`, replyTo: rv.client_email || undefined }); } catch (e) {} }
  return NextResponse.json({ ok: true, id, author: admin ? "studio" : "client" });
}
