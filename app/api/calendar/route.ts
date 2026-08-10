import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { calendarToken } from "@/lib/auth";

export const runtime = "nodejs";

function pad2(n: number) { return String(n).padStart(2, "0"); }
function stamp(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  return `${y}${pad2(m)}${pad2(d)}T${pad2(hh)}${pad2(mm)}00`;
}
function addMin(time: string, mins: number): string {
  const [h, m] = (time || "00:00").split(":").map(Number);
  let t = h * 60 + m + (mins || 0);
  t = ((t % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`;
}
function esc(v: any): string {
  return String(v == null ? "" : v).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, " ");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if ((searchParams.get("token") || "") !== calendarToken()) {
    return new NextResponse("Not found", { status: 404 });
  }
  const rows = await sql`SELECT data FROM portal_sessions WHERE status = 'active' AND date IS NOT NULL AND time IS NOT NULL ORDER BY date, time`;
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dot One Media//Portal Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Dot One Media Bookings",
    "X-WR-TIMEZONE:America/Anchorage",
  ];
  for (const r of rows as any[]) {
    const s: any = r.data || {};
    if (!s.date || !s.time) continue;
    const dur = Number(s.apptMin) || Number(s.durationMin) || 60;
    const title = `${s.clientName || "Client"} \u00b7 ${s.type || "Session"}`;
    const descParts: string[] = [];
    if (s.clientEmail) descParts.push("Client: " + s.clientEmail);
    if (Array.isArray(s.selectedAddons) && s.selectedAddons.length) descParts.push("Add-ons: " + s.selectedAddons.map((a: any) => a.name).join(", "));
    descParts.push("Booked through portal.dot1.media");
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + (s.id || "ses") + "@dot1.media",
      "DTSTAMP:" + dtstamp,
      "DTSTART:" + stamp(s.date, s.time),
      "DTEND:" + stamp(s.date, addMin(s.time, dur)),
      "SUMMARY:" + esc(title),
      "DESCRIPTION:" + esc(descParts.join(" \u00b7 ")),
      "LOCATION:" + esc(s.location || ""),
      "STATUS:CONFIRMED",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=dot-one-media.ics",
      "Cache-Control": "no-cache, max-age=0",
    },
  });
}

