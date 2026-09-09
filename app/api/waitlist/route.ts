import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureWaitlist } from "@/lib/waitlist";
import { sendPush } from "@/lib/push";
export const runtime = "nodejs";
export async function GET() {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureWaitlist();
  const rows = (await sql`SELECT id, email, name, service_name, to_char(date, 'YYYY-MM-DD') AS date, notified_at, created_at FROM waitlist WHERE date >= CURRENT_DATE ORDER BY date ASC, created_at ASC`) as any[];
  return NextResponse.json({ entries: rows });
}
export async function POST(req: Request) {
  const b: any = await req.json().catch(() => ({}));
  const email = String(b.email || "").toLowerCase().trim(), name = String(b.name || "").trim().slice(0, 120), date = String(b.date || "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Enter a valid email and date." }, { status: 400 });
  await ensureWaitlist();
  const sid = b.serviceId ? parseInt(String(b.serviceId), 10) : null;
  const dup = ((await sql`SELECT 1 FROM waitlist WHERE email = ${email} AND date = ${date}::date LIMIT 1`) as any[])[0];
  if (!dup) {
    await sql`INSERT INTO waitlist (id, email, name, service_id, service_name, date) VALUES (${"wl_" + Math.random().toString(36).slice(2, 10)}, ${email}, ${name}, ${sid}, ${String(b.serviceName || "").slice(0, 160)}, ${date}::date)`;
    try { await sendPush("Waitlist", (name || email) + " wants " + date + (b.serviceName ? " · " + b.serviceName : ""), "/"); } catch {}
  }
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  await ensureWaitlist(); if (id) await sql`DELETE FROM waitlist WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
