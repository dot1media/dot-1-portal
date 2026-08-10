import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, verifyClientToken, ADMIN_COOKIE, CLIENT_COOKIE } from "@/lib/auth";
import { sendEmail, bookingStudioEmail, bookingClientEmail, stageClientEmail, messageEmail, STAGE_LABELS } from "@/lib/email";

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
    const rows = await sql`SELECT data FROM portal_sessions WHERE status = 'active' AND date IS NOT NULL AND time IS NOT NULL`;
    const takenSlots = rows.map((r: any) => { const d = r.data || {}; return { id: d.id, date: d.date, time: d.time, apptMin: Number(d.apptMin) || Number(d.durationMin) || 30, padBefore: Number(d.padBefore) || 0, padAfter: Number(d.padAfter) || 0 }; });
    return NextResponse.json({ takenSlots });
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
  const ins = await sql`
    INSERT INTO portal_sessions (id, client_email, date, time, status, data)
    VALUES (${s.id}, ${clientEmail}, ${s.date || null}, ${s.time || null}, ${s.status || "active"}, ${dataStr}::jsonb)
    ON CONFLICT (id) DO UPDATE
      SET client_email = EXCLUDED.client_email, date = EXCLUDED.date, time = EXCLUDED.time,
          status = EXCLUDED.status, data = EXCLUDED.data, updated_at = now()
    RETURNING (xmax = 0) AS inserted
  `;
  if (ins[0] && (ins[0] as any).inserted) {
    await sendEmail({ to: s.notifyEmail || "contact@dot1.media", subject: "New booking: " + (s.type || "session") + " for " + (s.clientName || "a client"), html: bookingStudioEmail(s), replyTo: s.clientEmail });
    await sendEmail({ to: s.clientEmail, subject: "Your Dot One Media booking is confirmed", html: bookingClientEmail(s), replyTo: "contact@dot1.media" });
  }
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

  const old = (cur.data || {}) as any;
  if (me.role === "admin" && typeof allowed.currentStage === "number" && allowed.currentStage > (old.currentStage || 0)) {
    await sendEmail({ to: merged.clientEmail, subject: "Your " + (merged.type || "session") + " status: " + (STAGE_LABELS[allowed.currentStage] || "update"), html: stageClientEmail(merged, allowed.currentStage), replyTo: "contact@dot1.media" });
  }
  if (Array.isArray(allowed.comments) && allowed.comments.length > (old.comments || []).length) {
    const last = allowed.comments[allowed.comments.length - 1];
    if (last && last.author === "client") {
      await sendEmail({ to: merged.notifyEmail || "contact@dot1.media", subject: "New message from " + (merged.clientName || "your client"), html: messageEmail(merged, true, last.body), replyTo: merged.clientEmail });
    } else if (last && last.author === "studio") {
      await sendEmail({ to: merged.clientEmail, subject: "New reply from Dot One Media", html: messageEmail(merged, false, last.body), replyTo: "contact@dot1.media" });
    }
  }

  return NextResponse.json({ ok: true, session: merged });
}


export async function DELETE(request: Request) {
  const me = await whoami();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const rows = await sql`SELECT status FROM portal_sessions WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ ok: true });
  const status = (rows[0] as any).status;
  if (status !== "cancelled" && status !== "closed") {
    return NextResponse.json({ error: "Only cancelled or closed bookings can be deleted. Cancel or close it first." }, { status: 400 });
  }
  await sql`DELETE FROM portal_sessions WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

