import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { currentClientEmail } from "@/lib/gallery";
export const runtime = "nodejs";
const p2 = (n: number) => String(n).padStart(2, "0");
// Floating local time (no TZ): shows the booked wall-clock time in the client's calendar.
function icsLocal(date: string, time: string, addMin = 0) {
  const [y, m, d] = date.split("-").map(Number); const [hh, mm] = (time || "09:00").split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh || 0, (mm || 0) + addMin);
  return `${dt.getFullYear()}${p2(dt.getMonth() + 1)}${p2(dt.getDate())}T${p2(dt.getHours())}${p2(dt.getMinutes())}00`;
}
const esc = (s: any) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("sessionId") || "";
  if (!id) return NextResponse.json({ error: "Missing session." }, { status: 400 });
  const r = ((await sql`SELECT id, client_email, date, time, data FROM portal_sessions WHERE id = ${id} LIMIT 1`) as any[])[0];
  if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
  let ok = await hasStudio();
  if (!ok) { const em = await currentClientEmail(); ok = !!em && em === String(r.client_email || "").toLowerCase(); }
  if (!ok) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const d = r.data || {};
  const rawDate = d.date || r.date; const date = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : String(rawDate || "").slice(0, 10);
  const time = String(d.time || r.time || "09:00").slice(0, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "No date set yet." }, { status: 400 });
  const mins = Number(d.apptMin) || Number(d.durationMin) || 60;
  const title = (d.type || "Session") + " with Dot One Media";
  const loc = d.locationName || d.location || "";
  const desc = [d.locationUrl ? "Map: " + d.locationUrl : "", "Manage your session anytime at https://portal.dot1.media"].filter(Boolean).join("\n");
  const n = new Date(); const stamp = `${n.getUTCFullYear()}${p2(n.getUTCMonth() + 1)}${p2(n.getUTCDate())}T${p2(n.getUTCHours())}${p2(n.getUTCMinutes())}${p2(n.getUTCSeconds())}Z`;
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dot One Media//Portal//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT", `UID:${id}@portal.dot1.media`, `DTSTAMP:${stamp}`, `DTSTART:${icsLocal(date, time)}`, `DTEND:${icsLocal(date, time, mins)}`, `SUMMARY:${esc(title)}`, loc ? `LOCATION:${esc(loc)}` : "", `DESCRIPTION:${esc(desc)}`, "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${esc(title)} tomorrow`, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="dot-one-session.ics"`, "Cache-Control": "no-store" } });
}
