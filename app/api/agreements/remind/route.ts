import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { sendEmail, signReminderEmail } from "@/lib/email";

export const runtime = "nodejs";

// Studio-only: email a client a direct link to sign their outstanding agreements
// for a booking they've already paid for but not yet signed. The link drops them
// into the sign flow (/?sign=<sessionId>).
export async function POST(request: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const sessionId = String(b.sessionId || "");
  if (!sessionId) return NextResponse.json({ error: "A session id is required." }, { status: 400 });

  const rows = (await sql`SELECT data FROM portal_sessions WHERE id = ${sessionId} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  const s = rows[0].data || {};
  const email = String(s.clientEmail || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "This booking has no valid client email." }, { status: 400 });

  const link = "https://portal.dot1.media/?sign=" + encodeURIComponent(sessionId);
  const sent = await sendEmail({
    to: email,
    subject: "Please sign your Dot One Media agreement",
    html: signReminderEmail(s, link),
    replyTo: "contact@dot1.media",
  });
  if (!sent.ok) return NextResponse.json({ error: "Could not deliver the email: " + (sent.error || "unknown reason") }, { status: 502 });
  return NextResponse.json({ ok: true });
}
