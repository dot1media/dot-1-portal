import { sql } from "@/lib/db";
import webpush from "web-push";

let configured: boolean | null = null;
function config(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) { configured = false; return false; }
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:contact@dot1.media", pub, priv);
    configured = true;
  } catch { configured = false; }
  return configured;
}

export function formatWhen(date?: string, time?: string): string {
  let d = "";
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parts = date.split("-");
    const mo = Number(parts[1]); const day = Number(parts[2]);
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    d = (names[mo - 1] || "") + " " + day;
  } else if (date) { d = String(date); }
  let t = time ? String(time) : "";
  if (/^\d{1,2}:\d{2}$/.test(t)) {
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    const hh = ((h + 11) % 12) + 1;
    t = hh + ":" + String(m).padStart(2, "0") + " " + ap;
  }
  return d && t ? d + " at " + t : (d || t || "");
}

let ensured = false;
async function ensure() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS push_subscriptions (endpoint TEXT PRIMARY KEY, sub JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`;
  ensured = true;
}

export async function savePushSubscription(sub: any) {
  await ensure();
  await sql`INSERT INTO push_subscriptions (endpoint, sub) VALUES (${sub.endpoint}, ${JSON.stringify(sub)}::jsonb)
    ON CONFLICT (endpoint) DO UPDATE SET sub = ${JSON.stringify(sub)}::jsonb`;
}

export async function deletePushSubscription(endpoint: string) {
  await ensure();
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
}

// Fire-and-forget push to every subscribed studio device. Fail-soft: never throws.
export async function sendPush(title: string, body: string, url = "/") {
  if (!config()) return;
  try {
    await ensure();
    const rows = (await sql`SELECT endpoint, sub FROM push_subscriptions`) as any[];
    const payload = JSON.stringify({ title, body, url });
    await Promise.all(rows.map(async (r) => {
      try {
        await webpush.sendNotification(r.sub as any, payload);
      } catch (err: any) {
        const code = err && err.statusCode;
        if (code === 404 || code === 410) { try { await sql`DELETE FROM push_subscriptions WHERE endpoint = ${r.endpoint}`; } catch {} }
      }
    }));
  } catch {}
}
