import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, verifyClientToken, ADMIN_COOKIE, CLIENT_COOKIE, makeInviteToken } from "@/lib/auth";
import { hasStudio } from "@/lib/studioGuard";
import { sendEmail, sendToClient, bookingStudioEmail, bookingClientEmail, stageClientEmail, messageEmail, stageLabelFor, briefStudioEmail, cancelClientEmail, internalBookingEmail, galleryEmail, videoEmail, deliveryEmail, reviewEmail, inviteEmail, isFinalStage } from "@/lib/email";
import { GOOGLE_REVIEW_URL } from "@/lib/portal/constants";

export const runtime = "nodejs";

async function whoami() {
  const store = await cookies();
  const admin = verifyToken(store.get(ADMIN_COOKIE)?.value);
  if (admin && (await hasStudio())) return { role: "admin", email: admin.email };
  const client = verifyClientToken(store.get(CLIENT_COOKIE)?.value);
  if (client) return { role: "client", email: client.email };
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("slots")) {
    const rows = await sql`SELECT data FROM portal_sessions WHERE status = 'active' AND date IS NOT NULL AND time IS NOT NULL`;
    const takenSlots = rows.map((r: any) => { const d = r.data || {}; return { id: d.id, date: d.date, time: d.time, apptMin: Number(d.apptMin) || Number(d.durationMin) || 30, padBefore: Number(d.padBefore) || 0, padAfter: Number(d.padAfter) || 0 }; });
    try {
      const hrows = await sql`SELECT id, date, time, appt_min, pad_before, pad_after FROM holds WHERE expires_at > now()`;
      for (const h of hrows as any[]) takenSlots.push({ id: String(h.id), date: h.date, time: h.time, apptMin: Number(h.appt_min) || 30, padBefore: Number(h.pad_before) || 0, padAfter: Number(h.pad_after) || 0 });
    } catch (e) { /* holds table not present yet */ }
    return NextResponse.json({ takenSlots });
  }
  const me = await whoami();
  if (!me) return NextResponse.json({ sessions: [] });
  if (me.role === "admin") {
    const rows = await sql`SELECT data FROM portal_sessions ORDER BY created_at DESC`;
    return NextResponse.json({ sessions: rows.map((r: any) => r.data) });
  }
  const rows = await sql`SELECT data FROM portal_sessions WHERE lower(client_email) = ${me.email.toLowerCase()} AND (data->>'internal') IS DISTINCT FROM 'true' AND (data->>'imported') IS DISTINCT FROM 'true' ORDER BY created_at DESC`;
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
  if (ins[0] && (ins[0] as any).inserted && !s.imported) {
    await sendEmail({ to: s.notifyEmail || "contact@dot1.media", subject: "New booking: " + (s.type || "session") + " for " + (s.clientName || "a client"), html: bookingStudioEmail(s), replyTo: s.clientEmail });
    if (s.internal) {
      await sendEmail({ to: s.clientEmail, subject: "Your Dot One Media session is reserved", html: internalBookingEmail(s), replyTo: "contact@dot1.media" });
    } else {
      await sendEmail({ to: s.clientEmail, subject: "Your Dot One Media booking is confirmed", html: bookingClientEmail(s), replyTo: "contact@dot1.media" });
    }
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
    for (const k of ["comments", "clientImage", "brief"]) if (k in patch) allowed[k] = patch[k];
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
  if (me.role === "admin" && body.notifyStage !== false && typeof allowed.currentStage === "number" && allowed.currentStage > (old.currentStage || 0)) {
    await sendToClient(merged.clientEmail, "updates", { subject: "Your " + (merged.type || "session") + " status: " + stageLabelFor(merged, allowed.currentStage), html: stageClientEmail(merged, allowed.currentStage), replyTo: "contact@dot1.media" });
    if (isFinalStage(merged, allowed.currentStage)) {
      const rl = (process.env.GOOGLE_REVIEW_LINK || GOOGLE_REVIEW_URL || "").trim();
      if (rl && merged.clientEmail) { try { await sendEmail({ to: merged.clientEmail, subject: "Thank you from Dot One Media", html: reviewEmail(merged, rl), replyTo: "contact@dot1.media" }); } catch (e) {} }
    }
  }
  if (Array.isArray(allowed.comments) && allowed.comments.length > (old.comments || []).length) {
    const last = allowed.comments[allowed.comments.length - 1];
    if (last && last.author === "client") {
      const subj = last.body ? "New message from " + (merged.clientName || "your client") : (merged.clientName || "Your client") + " sent an image";
      await sendEmail({ to: merged.notifyEmail || "contact@dot1.media", subject: subj, html: messageEmail(merged, true, last.body, last.image), replyTo: merged.clientEmail });
    } else if (last && last.author === "studio") {
      const subj = last.body ? "New reply from Dot One Media" : "Dot One Media sent you an image";
      await sendToClient(merged.clientEmail, "messages", { subject: subj, html: messageEmail(merged, false, last.body, last.image), replyTo: "contact@dot1.media" });
    }
  }
  if (me.role === "admin") {
    const want = new Set<string>();
    if (typeof body.emailDelivery === "string") want.add(body.emailDelivery);
    if (Array.isArray(body.emailDeliveryKinds)) for (const k of body.emailDeliveryKinds) want.add(String(k));
    if (want.size && merged.clientEmail) {
      const DKINDS = [
        { field: "deliveryPhoto", kind: "gallery", subj: "Your gallery from Dot One Media is ready" },
        { field: "deliveryVideo", kind: "video", subj: "Your video from Dot One Media is ready" },
        { field: "deliveryMusic", kind: "music", subj: "Your audio from Dot One Media is ready" },
        { field: "deliveryGov", kind: "government", subj: "Your deliverables from Dot One Media are ready" },
      ];
      for (const d of DKINDS) {
        const url = String((merged as any)[d.field] || "").trim();
        if (want.has(d.kind) && url) {
          try { await sendEmail({ to: merged.clientEmail, subject: d.subj, html: deliveryEmail(merged, d.kind, url), replyTo: "contact@dot1.media" }); } catch (e) {}
        }
      }
    }
  }
  if (me.role === "admin" && body.sendReview && merged.clientEmail) {
    const rl = (process.env.GOOGLE_REVIEW_LINK || GOOGLE_REVIEW_URL || "").trim();
    if (rl) { try { await sendEmail({ to: merged.clientEmail, subject: "Thank you from Dot One Media", html: reviewEmail(merged, rl), replyTo: "contact@dot1.media" }); } catch (e) {} }
  }
  if (me.role === "admin" && body.sendInvite && merged.clientEmail) {
    const link = "https://portal.dot1.media/?invite=" + encodeURIComponent(makeInviteToken(merged.clientEmail, merged.clientName || ""));
    try { await sendEmail({ to: merged.clientEmail, subject: "Track your session with Dot One Media", html: inviteEmail(merged, link), replyTo: "contact@dot1.media" }); } catch (e) {}
  }
  if (me.role === "client" && allowed.brief && allowed.brief.submitted && !(old.brief && old.brief.submitted)) {
    await sendEmail({ to: merged.notifyEmail || "contact@dot1.media", subject: (merged.clientName || "A client") + " submitted their production brief", html: briefStudioEmail(merged), replyTo: merged.clientEmail });
  }

  if (me.role === "admin" && merged.status === "cancelled" && (old.status || "active") !== "cancelled") {
    await sendToClient(merged.clientEmail, "updates", { subject: "Your " + (merged.type || "booking") + " has been cancelled", html: cancelClientEmail(merged), replyTo: "contact@dot1.media" });
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


