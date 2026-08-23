import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { hasStudio } from "@/lib/studioGuard";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

// Public inquiry endpoint - the marketing site (a different origin) POSTs here,
// so it needs CORS. The POST carries no credentials, so a wildcard origin is fine.
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS site_inquiries (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    handled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  ensured = true;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Public: a site visitor sends a question/request.
export async function POST(request: Request) {
  await ensureTable();
  const b = await request.json().catch(() => ({}));
  // honeypot: bots fill the hidden "website" field. Silently accept + drop.
  if (String(b.website || "").trim()) return NextResponse.json({ ok: true }, { headers: CORS });
  const name = String(b.name || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().slice(0, 200);
  const message = String(b.message || "").trim().slice(0, 4000);
  if (!name || !email || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please add your name, a valid email, and a message." }, { status: 400, headers: CORS });
  }
  await sql`INSERT INTO site_inquiries (name, email, message) VALUES (${name}, ${email}, ${message})`;
  // Let the studio know right away; reply-to goes straight back to the sender.
  try {
    const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await sendEmail({
      to: "contact@dot1.media",
      subject: "New website message from " + name,
      replyTo: email,
      html: '<div style="font-family:Arial,sans-serif;font-size:14px;color:#33322d;line-height:1.6"><p><b>' + esc(name) + '</b> (' + esc(email) + ') sent a message through dot1.media:</p><blockquote style="margin:10px 0;padding:10px 14px;border-left:3px solid #e23b2e;background:#fbf8f2;white-space:pre-wrap">' + esc(message) + '</blockquote><p style="font-size:12px;color:#6f6d65">It is also waiting in the portal Inbox: <a href="https://portal.dot1.media">portal.dot1.media</a>. Replying to this email replies to ' + esc(name.split(" ")[0]) + ' directly.</p></div>',
    });
  } catch (e) {}
  return NextResponse.json({ ok: true }, { headers: CORS });
}

// Admin: list inquiries for the studio inbox.
export async function GET() {
  await ensureTable();
  const store = await cookies();
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const rows = await sql`SELECT id, name, email, message, handled, created_at FROM site_inquiries ORDER BY created_at DESC LIMIT 300`;
  return NextResponse.json({ inquiries: rows });
}
