import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { currentClientEmail } from "@/lib/gallery";
import { sendEmail } from "@/lib/email";
import { sendPush, formatWhen } from "@/lib/push";
import { notifyWaitlist } from "@/lib/waitlist";
export const runtime = "nodejs";

// Mirrors PAYMENT_RULES[line].reschedFee in lib/portal/stages.js (kept here to avoid importing icon modules server-side).
const RESCHED_FEE: Record<string, number> = { video: 150, photo: 0, music: 0, government: 0 };
const CUTOFF_HOURS = 48;
const toMin = (t: string) => { const [h, m] = String(t).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const toHHMM = (n: number) => String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0");
const normDate = (v: any) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v || "").slice(0, 10));
const normTime = (v: any) => String(v || "").slice(0, 5);

async function loadSession(id: string) { return ((await sql`SELECT id, client_email, date, time, status, data FROM portal_sessions WHERE id = ${id} LIMIT 1`) as any[])[0] || null; }
async function canAccess(r: any) { if (await hasStudio()) return true; const em = await currentClientEmail(); return !!em && em === String(r.client_email || "").toLowerCase(); }
function hoursUntil(date: string, time: string) { const [y, m, d] = date.split("-").map(Number); const [hh, mm] = (time || "09:00").split(":").map(Number); return (new Date(y, m - 1, d, hh, mm).getTime() - Date.now()) / 3600000; }

async function computeSlots(sessionId: string, d: any) {
  try { await sql`ALTER TABLE availability ADD COLUMN IF NOT EXISTS service_ids JSONB`; } catch {}
  const wins = (await sql`SELECT to_char(date, 'YYYY-MM-DD') AS date, to_char(start_time, 'HH24:MI') AS start, to_char(end_time, 'HH24:MI') AS "end", COALESCE(service_ids, '[]'::jsonb) AS "serviceIds" FROM availability WHERE date >= CURRENT_DATE`) as any[];
  const sid = d.serviceId;
  const specific = sid ? wins.filter((w) => (Array.isArray(w.serviceIds) ? w.serviceIds : []).map(String).includes(String(sid))) : [];
  const useWins = specific.length ? specific : wins.filter((w) => !Array.isArray(w.serviceIds) || w.serviceIds.length === 0);
  const others = (await sql`SELECT id, data FROM portal_sessions WHERE status IS DISTINCT FROM 'cancelled' AND id <> ${sessionId}`) as any[];
  let holds: any[] = []; try { await sql`DELETE FROM holds WHERE expires_at < now()`; holds = (await sql`SELECT date, time, appt_min, pad_before, pad_after FROM holds`) as any[]; } catch {}
  const taken = [
    ...others.map((o) => { const x = o.data || {}; return { date: normDate(x.date), time: normTime(x.time), apptMin: Number(x.apptMin) || Number(x.durationMin) || 30, padB: Number(x.padBefore) || 0, padA: Number(x.padAfter) || 0 }; }),
    ...holds.map((h) => ({ date: normDate(h.date), time: normTime(h.time), apptMin: Number(h.appt_min) || 30, padB: Number(h.pad_before) || 0, padA: Number(h.pad_after) || 0 })),
  ].filter((t) => t.date && t.time);
  const apptMin = Number(d.apptMin) || Number(d.durationMin) || 30, padB = Number(d.padBefore) || 0, padA = Number(d.padAfter) || 0;
  const slots: Record<string, string[]> = {};
  for (const date of Array.from(new Set(useWins.map((w) => w.date))).sort()) {
    const busy = taken.filter((t) => t.date === date).map((t) => [toMin(t.time) - t.padB, toMin(t.time) + t.apptMin + t.padA]);
    const out = new Set<string>();
    for (const w of useWins.filter((x) => x.date === date)) {
      for (let t = toMin(w.start); t + apptMin <= toMin(w.end); t += 15) {
        const s = t - padB, e = t + apptMin + padA;
        if (!busy.some(([bs, be]) => s < be && e > bs)) out.add(toHHMM(t));
      }
    }
    if (out.size) slots[date] = Array.from(out).sort();
  }
  return slots;
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("sessionId") || "";
  const r = await loadSession(id); if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!(await canAccess(r))) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const d = r.data || {}; const curDate = normDate(d.date || r.date), curTime = normTime(d.time || r.time);
  const withinCutoff = !!curDate && hoursUntil(curDate, curTime) < CUTOFF_HOURS;
  const slots = await computeSlots(id, d);
  return NextResponse.json({ dates: Object.keys(slots), slots, withinCutoff, cutoffHours: CUTOFF_HOURS, fee: RESCHED_FEE[d.serviceLine] || 0, current: { date: curDate, time: curTime } });
}

export async function POST(req: Request) {
  const b: any = await req.json().catch(() => ({}));
  const id = String(b.sessionId || ""), date = String(b.date || ""), time = String(b.time || "").slice(0, 5);
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return NextResponse.json({ error: "Pick a date and time." }, { status: 400 });
  const r = await loadSession(id); if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!(await canAccess(r))) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const d = r.data || {}; const admin = await hasStudio();
  const curDate = normDate(d.date || r.date), curTime = normTime(d.time || r.time);
  if (!admin && curDate && hoursUntil(curDate, curTime) < CUTOFF_HOURS) return NextResponse.json({ error: "Your session is within " + CUTOFF_HOURS + " hours. Please message us and we'll help you move it.", withinCutoff: true }, { status: 409 });
  const slots = await computeSlots(id, d);
  if (!(slots[date] || []).includes(time)) return NextResponse.json({ error: "That time just became unavailable. Please pick another." }, { status: 409 });
  const fee = admin ? 0 : (RESCHED_FEE[d.serviceLine] || 0);
  const oldWhen = formatWhen(curDate, curTime), newWhen = formatWhen(date, time);
  const note = "Rescheduled from " + oldWhen + " to " + newWhen + (fee ? " \u00b7 a $" + fee + " reschedule fee was added to the balance" : "");
  const nd = { ...d, date, time, total: fee ? (Number(d.total) || 0) + fee : d.total, rescheduleFee: (Number(d.rescheduleFee) || 0) + fee, comments: [...(Array.isArray(d.comments) ? d.comments : []), { author: admin ? "studio" : "client", body: note, time: "just now", read: admin }] };
  await sql`UPDATE portal_sessions SET date = ${date}::date, time = ${time}::time, data = ${JSON.stringify(nd)}::jsonb WHERE id = ${id}`;
  if (!admin) {
    try { await sendEmail({ to: d.notifyEmail || "contact@dot1.media", subject: "Rescheduled: " + (d.clientName || "a client") + " \u00b7 " + (d.type || "session"), html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#33322d"><p><b>${d.clientName || "A client"}</b> moved their <b>${d.type || "session"}</b>.</p><p>${oldWhen} &rarr; <b>${newWhen}</b>${fee ? `<br/>A $${fee} reschedule fee was added to their balance.` : ""}</p></div>`, replyTo: r.client_email || undefined }); } catch (e) {}
    try { await sendPush("Rescheduled", [(d.clientName || "A client"), (d.type || "session"), newWhen].join(" \u00b7 "), "/"); } catch (e) {}
  }
  if (curDate && curDate !== date) { try { await notifyWaitlist(curDate); } catch (e) {} }
  return NextResponse.json({ ok: true, date, time, fee, session: nd });
}
