import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { chargeRequestEmail, sendToClient } from "@/lib/email";
import crypto from "crypto";

export const runtime = "nodejs";

function squareBase() {
  return (process.env.SQUARE_ENV || "").trim() === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
}

// Admin creates an ad-hoc payment request (add-on) on an existing appointment:
// generates a Square checkout link, stores the charge on the session, emails the client.
export async function POST(request: Request) {
  const store = await cookies();
  if (!verifyToken(store.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = (process.env.SQUARE_ACCESS_TOKEN || "").trim();
  const locationId = (process.env.SQUARE_LOCATION_ID || "").trim();
  if (!token || !locationId) return NextResponse.json({ error: "Payments are not configured." }, { status: 400 });

  const b = await request.json().catch(() => ({}));
  const sid = String(b.sessionId || "");
  const label = String(b.label || "").trim().slice(0, 80);
  const amountCents = Math.round((Number(b.amount) || 0) * 100);
  if (!sid) return NextResponse.json({ error: "Missing appointment." }, { status: 400 });
  if (!label) return NextResponse.json({ error: "Add a short description of what this charge is for." }, { status: 400 });
  if (amountCents <= 0) return NextResponse.json({ error: "Enter an amount greater than zero." }, { status: 400 });

  const rows = await sql`SELECT data FROM portal_sessions WHERE id = ${sid} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  const data = (rows[0] as any).data || {};

  const chargeId = "chg_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const payload: any = {
    idempotency_key: crypto.randomUUID(),
    quick_pay: { name: label.slice(0, 60), price_money: { amount: amountCents, currency: "USD" }, location_id: locationId },
    checkout_options: { redirect_url: "https://portal.dot1.media/?paid=" + sid + "&kind=charge&charge=" + chargeId },
    payment_note: "Add-on for booking " + sid,
  };
  if (data.clientEmail) payload.pre_populated_data = { buyer_email: data.clientEmail };

  let res: Response, sq: any = {};
  try {
    res = await fetch(squareBase() + "/v2/online-checkout/payment-links", { method: "POST", headers: { "Square-Version": "2026-07-15", Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    sq = await res.json().catch(() => ({}));
  } catch (fe: any) {
    return NextResponse.json({ error: "Could not reach Square: " + (fe && fe.message ? fe.message : String(fe)) }, { status: 502 });
  }
  if (!res.ok || !sq.payment_link || !sq.payment_link.url) {
    const e0 = sq && Array.isArray(sq.errors) && sq.errors[0] ? sq.errors[0] : null;
    return NextResponse.json({ error: "Square error (" + (e0 ? e0.code + (e0.detail ? ": " + e0.detail : "") : "HTTP " + res.status) + ")" }, { status: 502 });
  }

  const charge = { id: chargeId, label, amountCents, status: "pending", squareOrderId: sq.payment_link.order_id || "", squareLink: sq.payment_link.url, createdAt: new Date().toISOString() };
  const charges = Array.isArray(data.charges) ? data.charges : [];
  const merged = { ...data, charges: [...charges, charge] };
  await sql`UPDATE portal_sessions SET data = ${JSON.stringify(merged)}::jsonb, updated_at = now() WHERE id = ${sid}`;

  try { await sendToClient(data.clientEmail, "payments", { subject: "A payment request from Dot One Media", html: chargeRequestEmail(data, charge, charge.squareLink) }); } catch (e) {}

  return NextResponse.json({ ok: true, charge });
}

