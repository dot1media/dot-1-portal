import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { currentClientEmail } from "@/lib/gallery";
import { sendEmail } from "@/lib/email";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const b: any = await req.json().catch(() => ({}));
  const galleryId = String(b.galleryId || "");
  const em = await currentClientEmail();
  if (!em || !galleryId) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const g = ((await sql`SELECT * FROM galleries WHERE id = ${galleryId} AND lower(client_email) = ${em} LIMIT 1`) as any[])[0];
  if (!g) return NextResponse.json({ error: "Not found." }, { status: 404 });
  try { await sendEmail({ to: "contact@dot1.media", subject: "Gallery: additional images requested", html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#33322d"><p><b>${em}</b> would like additional images beyond their included ${g.included ?? ""}.</p><p>Gallery: ${g.title || galleryId}</p></div>`, replyTo: em }); } catch (e) {}
  return NextResponse.json({ ok: true });
}
