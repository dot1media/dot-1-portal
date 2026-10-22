import { NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { resolveLineItems } from "@/lib/create-invoice";

export const runtime = "nodejs";

let ensured = false;
export async function ensureQuoteTable() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    session_id TEXT,
    status TEXT NOT NULL DEFAULT 'quote',
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  ensured = true;
}

export async function GET() {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureQuoteTable();
  const rows = (await sql`SELECT id, token, session_id, status, data, created_at FROM quotes ORDER BY created_at DESC LIMIT 200`) as any[];
  return NextResponse.json({ quotes: rows.map((r) => ({ id: r.id, token: r.token, sessionId: r.session_id, status: r.status, createdAt: r.created_at, ...(r.data || {}) })) });
}

export async function POST(request: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureQuoteTable();
  const b = await request.json().catch(() => ({}));

  const name = String(b.name || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  const phone = String(b.phone || "").trim().slice(0, 40);
  const date = String(b.date || "");
  const time = String(b.time || "");
  const notes = String(b.notes || "").trim().slice(0, 1200);
  const sessionId = b.sessionId ? String(b.sessionId).slice(0, 80) : null;
  if (!name || !b.serviceId) return NextResponse.json({ error: "A name and a service are required." }, { status: 400 });

  const r = await resolveLineItems(b);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  const { svc, grp, items, totalCents, retainerCents } = r as Required<typeof r>;
  if (totalCents <= 0) return NextResponse.json({ error: "The quote total must be greater than zero." }, { status: 400 });

  const token = "quo_" + crypto.randomBytes(9).toString("hex");
  const validDays = Math.max(1, Math.min(180, Math.round(Number(b.validDays) || 30)));
  const validUntil = Date.now() + validDays * 86400000;

  // Keep the raw inputs so "convert to invoice" re-runs the exact invoice pipeline.
  const input = {
    name, email, phone, serviceId: String(b.serviceId), date, time, notes,
    addons: Array.isArray(b.addons) ? b.addons : (Array.isArray(b.addonIds) ? b.addonIds.map((id: any) => ({ id, qty: 1 })) : []),
    custom: Array.isArray(b.custom) ? b.custom : [],
    cc: String(b.cc || ""),
  };

  const ins = (await sql`INSERT INTO quotes (token, session_id, status, data) VALUES (${token}, ${sessionId}, ${"quote"}, ${JSON.stringify({})}::jsonb) RETURNING id`) as any[];
  const no = "QUO-" + String(1000 + (ins[0]?.id || 0));
  const data = {
    no, createdAt: Date.now(), validUntil,
    client: { name, email, phone },
    service: { id: svc.id, name: svc.name, group: grp, date, time, duration: svc.duration_min || 60 },
    items, totalCents, retainerCents, notes, input,
  };
  await sql`UPDATE quotes SET data = ${JSON.stringify(data)}::jsonb WHERE token = ${token}`;

  return NextResponse.json({ ok: true, quote: { token, sessionId, status: "quote", ...data } });
}
