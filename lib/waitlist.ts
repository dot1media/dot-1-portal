import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { PORTAL_ROOT } from "@/lib/portal/constants";
let ensured = false;
export async function ensureWaitlist() { if (ensured) return; await sql`CREATE TABLE IF NOT EXISTS waitlist (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT DEFAULT '', service_id INT, service_name TEXT DEFAULT '', date DATE NOT NULL, notified_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now())`; ensured = true; }
// Email everyone waiting on a date who hasn't been told yet. Returns how many were notified.
export async function notifyWaitlist(date: string, reason = "A spot just opened"): Promise<number> {
  await ensureWaitlist();
  const rows = (await sql`SELECT id, email, name, service_id, service_name FROM waitlist WHERE date = ${date}::date AND notified_at IS NULL`) as any[];
  let n = 0;
  for (const w of rows) {
    const link = PORTAL_ROOT + (w.service_id ? "?s=" + w.service_id : "");
    const nice = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    try {
      await sendEmail({ to: w.email, subject: reason + " on " + nice, html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#33322d;line-height:1.6;max-width:560px"><p>Hi ${w.name || "there"},</p><p>Good news: ${reason.toLowerCase()} for <b>${nice}</b>${w.service_name ? ` (${w.service_name})` : ""}. Spots go quickly, so book while it's open.</p><p><a href="${link}" style="display:inline-block;background:#e23b2e;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600">Book now</a></p><p style="font-size:12px;color:#6f6d65">You asked to be told when this date opened. This is the only reminder we'll send for it.</p></div>` });
      await sql`UPDATE waitlist SET notified_at = now() WHERE id = ${w.id}`; n++;
    } catch {}
  }
  return n;
}
