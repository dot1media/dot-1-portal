import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, verifyClientToken, ADMIN_COOKIE, CLIENT_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

async function whoami() {
  const store = await cookies();
  const admin = verifyToken(store.get(ADMIN_COOKIE)?.value);
  if (admin) return { role: "admin", email: admin.email };
  const client = verifyClientToken(store.get(CLIENT_COOKIE)?.value);
  if (client) return { role: "client", email: client.email };
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("slots")) {
    const rows = await sql`SELECT id, date, time FROM portal_sessions WHERE status = 'active' AND date IS NOT NULL AND time IS NOT NULL`;
    return NextResponse.json({ takenSlots: rows });
  }
  const me = await whoami();
  if (!me) return NextResponse.json({ sessions: [] });
  if (me.role === "admin") {
    const rows = await sql`SELECT data FROM portal_sessions ORDER BY created_at DESC`;
    return NextResponse.json({ sessions: rows.map((r: any) => r.data) });
  }
  const rows = await sql`SELECT data FROM portal_sessions WHERE lower(client_email) = ${me.email.toLowerCase()} ORDER BY created_at DESC`;
  return NextResponse.json({ sessions: rows.map((r: any) => r.data) });
}

export async function POST(request: Request) {
  const me = await whoami();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const s = body.session;
  if (!s || !s.id) return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  const clientEmail = me.role === "client" ? me.email.toLowerCase() : String(s.clientEmail || "").toLowerCase();
  const dataStr = JSON.stringify(s);
  await sql`
    INSERT INTO portal_sessions (id, client_email, date, time, status, data)
    VALUES (${s.id}, ${clientEmail}, ${s.date || null}, ${s.time || null}, ${s.status || "active"}, ${dataStr}::jsonb)
    ON CONFLICT (id) DO UPDATE
      SET client_email = EXCLUDED.client_email, date = EXCLUDED.date, time = EXCLUDED.time,
          status = EXCLUDED.status, data = EXCLUDED.data, updated_at = now()
  `;
  return NextResponse.json({ ok: true, session: s });
}

export async function PATCH(request: Request) {
  const me = await whoami();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  const patch = body.patch || {};
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const rows = await sql`SELECT client_email, data FROM portal_sessions WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const cur = rows[0] as any;
  if (me.role === "client" && String(cur.client_email || "").toLowerCase() !== me.email.toLowerCase()) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  let allowed: any = patch;
  if (me.role === "client") {
    allowed = {};
    for (const k of ["comments", "clientImage"]) if (k in patch) allowed[k] = patch[k];
  }
  const merged = { ...cur.data, ...allowed };
  const dataStr = JSON.stringify(merged);
  await sql`
    UPDATE portal_sessions
    SET data = ${dataStr}::jsonb, date = ${merged.date || null}, time = ${merged.time || null},
        status = ${merged.status || "active"}, updated_at = now()
    WHERE id = ${id}
  `;
  return NextResponse.json({ ok: true, session: merged });
}

