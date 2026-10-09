import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendPush } from "@/lib/push";

export const runtime = "nodejs";

// Public endpoint: the marketing site (a different origin) POSTs an email here to request the
// Dot One Media capability statement. This is a prospect lead, NOT a client session email, so it
// sends directly via sendEmail and is never gated by the client-email cutover switch.
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const PDF_URL = "https://portal.dot1.media/Dot-One-Media-Capability-Statement.pdf";
const ACCENT = "#e23b2e";

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS capability_requests (
    id SERIAL PRIMARY KEY,
    name TEXT DEFAULT '',
    email TEXT NOT NULL,
    org TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  ensured = true;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function esc(t: string) { return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

export async function POST(request: Request) {
  await ensureTable();
  const b = await request.json().catch(() => ({}));
  if (String(b.website || "").trim()) return NextResponse.json({ ok: true }, { headers: CORS }); // honeypot
  const email = String(b.email || "").trim().slice(0, 200);
  const name = String(b.name || "").trim().slice(0, 120);
  const org = String(b.org || "").trim().slice(0, 160);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400, headers: CORS });
  }

  try { await sql`INSERT INTO capability_requests (name, email, org) VALUES (${name}, ${email}, ${org})`; } catch (e) {}

  const first = name ? esc(name.split(" ")[0]) : "";
  // Deliver the statement to the requester.
  try {
    await sendEmail({
      to: email,
      replyTo: "contact@dot1.media",
      subject: "Dot One Media · Capability Statement",
      html: `<div style="margin:0;padding:0;background:#fbf8f2;">
        <div style="max-width:560px;margin:0 auto;padding:36px 22px;font-family:'Helvetica Neue',Arial,sans-serif;color:#2b2926;">
          <div style="font-family:Georgia,serif;font-weight:700;font-size:24px;color:#141311;">Dot One Media<span style="color:${ACCENT};">.</span></div>
          <div style="font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#8a857c;margin-top:6px;">Service-Disabled Veteran-Owned Small Business</div>
          <div style="height:2px;background:${ACCENT};margin:18px 0 22px;width:48px;"></div>
          <p style="font-size:14px;line-height:1.65;color:#4a463f;margin:0 0 16px;">Thank you${first ? ", " + first : ""} for your interest in Dot One Media. Our capability statement is ready for you below.</p>
          <p style="font-size:14px;line-height:1.65;color:#4a463f;margin:0 0 22px;">We are a veteran-owned Alaska media production studio, full-service video, photography, documentary, and strategic editorial media, built for government and mission-driven work.</p>
          <a href="${PDF_URL}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.02em;padding:13px 24px;border-radius:8px;">Download the Capability Statement (PDF)</a>
          <p style="font-size:12.5px;line-height:1.6;color:#6b665e;margin:22px 0 0;">Questions or a project to discuss? Just reply to this email, or reach us at contact@dot1.media · 907·712·4890.</p>
          <div style="margin-top:26px;padding-top:16px;border-top:1px solid #ece8e0;font-size:11px;color:#a8a49a;line-height:1.7;">
            <div style="letter-spacing:0.16em;text-transform:uppercase;color:#8a857c;">Dot One Media · DOT ONE LLC · Wasilla, Alaska</div>
            <div style="font-family:Georgia,serif;font-style:italic;margin-top:7px;">The dot is the point of light. The one is the singular truth.</div>
          </div>
        </div>
      </div>`,
    });
  } catch (e) {}

  // Notify the studio of the new lead.
  try {
    await sendEmail({
      to: process.env.NOTIFY_EMAIL || "contact@dot1.media",
      replyTo: email,
      subject: "Capability statement requested" + (org ? " · " + org : "") + " (" + email + ")",
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#33322d;line-height:1.6"><p>A capability statement was just requested from dot1.media:</p><ul><li><b>Email:</b> ${esc(email)}</li>${name ? `<li><b>Name:</b> ${esc(name)}</li>` : ""}${org ? `<li><b>Organization:</b> ${esc(org)}</li>` : ""}</ul><p style="font-size:12px;color:#6f6d65">Replying to this email replies to them directly. New federal/contracting leads are worth a prompt follow-up.</p></div>`,
    });
  } catch (e) {}
  try { await sendPush("Capability statement requested", email + (org ? " · " + org : ""), "/"); } catch (e) {}

  return NextResponse.json({ ok: true }, { headers: CORS });
}
