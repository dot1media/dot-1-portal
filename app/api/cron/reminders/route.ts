import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendToClient } from "@/lib/email";
import { sendPush, formatWhen } from "@/lib/push";
export const runtime = "nodejs";

function daysUntil(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const n = new Date(); const today = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
  return Math.round((target - today) / 86400000);
}
const wrap = (inner: string) => `<div style="font-family:Arial,sans-serif;font-size:14px;color:#33322d;line-height:1.6;max-width:560px">${inner}<p style="font-size:12px;color:#6f6d65;margin-top:18px">Manage your session anytime at <a href="https://portal.dot1.media" style="color:#e23b2e">portal.dot1.media</a>.</p></div>`;
function reminderHtml(type: string, when: string, d: any, phrase: string) {
  const loc = d.locationName ? `<p><b>Where:</b> ${d.locationName}${d.locationUrl ? ` (<a href="${d.locationUrl}" style="color:#e23b2e">map</a>)` : ""}</p>` : "";
  return wrap(`<p>Hi ${d.clientName || "there"},</p><p>Just a friendly reminder that your <b>${type}</b> with Dot One Media is <b>${phrase}</b>.</p><p><b>When:</b> ${when}</p>${loc}<p>We're looking forward to it. If anything has changed, reply to this email and we'll sort it out.</p>`);
}
function balanceHtml(type: string, when: string, due: number, overdue = false) {
  return wrap(`<p>${overdue ? "A quick reminder that" : "Ahead of your session,"} the remaining balance for your <b>${type}</b>${when ? ` (${when})` : ""} is <b>$${due.toFixed(2)}</b>.</p><p>You can pay it in your portal in a moment, or reply here with any questions.</p>`);
}
async function alreadySent(sid: string, kind: string) { const r = (await sql`SELECT 1 FROM reminders_sent WHERE session_id = ${sid} AND kind = ${kind} LIMIT 1`) as any[]; return r.length > 0; }
async function markSent(sid: string, kind: string) { await sql`INSERT INTO reminders_sent (session_id, kind) VALUES (${sid}, ${kind}) ON CONFLICT DO NOTHING`; }

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cron not configured." }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await sql`CREATE TABLE IF NOT EXISTS reminders_sent (session_id TEXT NOT NULL, kind TEXT NOT NULL, sent_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (session_id, kind))`;
  const rows = (await sql`SELECT id, client_email, date, status, data FROM portal_sessions WHERE status IS DISTINCT FROM 'cancelled'`) as any[];
  const sent = { h48: 0, h24: 0, balance: 0, overdue: 0 };
  const tomorrow: string[] = [];
  for (const r of rows) {
    const d = r.data || {};
    const raw = d.date || r.date; const date = raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const email = String(r.client_email || d.clientEmail || ""); if (!email) continue;
    if ((d.status || r.status || "active") === "cancelled" || d.internal) continue;
    const days = daysUntil(date);
    const when = formatWhen(date, d.time);
    const type = d.type || "session";
    if (days === 2 && !(await alreadySent(r.id, "48h"))) { try { await sendToClient(email, "updates", { subject: "Your " + type + " is in two days", html: reminderHtml(type, when, d, "in two days"), replyTo: "contact@dot1.media" }); await markSent(r.id, "48h"); sent.h48++; } catch (e) {} }
    if (days === 1) {
      tomorrow.push([d.clientName || "Client", type, d.time ? formatWhen("", d.time) : ""].filter(Boolean).join(" \u00b7 "));
      if (!(await alreadySent(r.id, "24h"))) { try { await sendToClient(email, "updates", { subject: "See you tomorrow: your " + type, html: reminderHtml(type, when, d, "tomorrow"), replyTo: "contact@dot1.media" }); await markSent(r.id, "24h"); sent.h24++; } catch (e) {} }
    }
    const total = Number(d.total) || 0; const paid = d.paymentStatus === "paid" ? (Number(d.payAmount) || 0) : 0; const due = total - paid;
    if (due > 0 && d.paymentStatus === "paid" && d.balanceStatus !== "paid") {
      if (days >= 0 && days <= 7 && !(await alreadySent(r.id, "balance"))) { try { await sendToClient(email, "payments", { subject: "Balance due for your " + type, html: balanceHtml(type, when, due), replyTo: "contact@dot1.media" }); await markSent(r.id, "balance"); sent.balance++; } catch (e) {} }
      if (days < 0 && days >= -30 && !(await alreadySent(r.id, "balance-overdue"))) { try { await sendToClient(email, "payments", { subject: "Reminder: remaining balance for your " + type, html: balanceHtml(type, when, due, true), replyTo: "contact@dot1.media" }); await markSent(r.id, "balance-overdue"); sent.overdue++; } catch (e) {} }
    }
  }
  if (tomorrow.length) { try { await sendPush("Tomorrow: " + tomorrow.length + " session" + (tomorrow.length === 1 ? "" : "s"), tomorrow.slice(0, 3).join("  |  "), "/"); } catch (e) {} }
  return NextResponse.json({ ok: true, sent, tomorrow: tomorrow.length });
}
