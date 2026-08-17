import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

// Public inquiry endpoint - the marketing site (a different origin) POSTs here,
// so it needs CORS. The POST carries no credentials, so a wildcard origin is fine.
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS site_inquiries (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    handled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  ensured = true;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Public: a site visitor sends a question/request.
export async function POST(request: Request) {
  await ensureTable();
  const b = await request.json().catch(() => ({}));
  // honeypot: bots fill the hidden "website" field. Silently accept + drop.
  if (String(b.website || "").trim()) return NextResponse.json({ ok: true }, { headers: CORS });
  const name = String(b.name || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().slice(0, 200);
  const message = String(b.message || "").trim().slice(0, 4000);
  if (!name || !email || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please add your name, a valid email, and a message." }, { status: 400, headers: CORS });
  }
  await sql`INSERT INTO site_inquiries (name, email, message) VALUES (${name}, ${email}, ${message})`;
  return NextResponse.json({ ok: true }, { headers: CORS });
}

// Admin: list inquiries for the studio inbox.
export async function GET() {
  await ensureTable();
  const store = await cookies();
  if (!verifyToken(store.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const rows = await sql`SELECT id, name, email, message, handled, created_at FROM site_inquiries ORDER BY created_at DESC LIMIT 300`;
  return NextResponse.json({ inquiries: rows });
}
