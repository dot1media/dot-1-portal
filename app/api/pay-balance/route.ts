import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { sendEmail, balanceEmail } from "@/lib/email";
import crypto from "crypto";

export const runtime = "nodejs";

function squareBase() {
  return (process.env.SQUARE_ENV || "").trim() === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
}

export async function POST(request: Request) {
  const store = await cookies();
  if (!verifyToken(store.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const token = (process.env.SQUARE_ACCESS_TOKEN || "").trim();
  const locationId = (process.env.SQUARE_LOCATION_ID || "").trim();
  if (!token || !locationId) return NextResponse.json({ error: "Square is not configured." }, { status: 400 });

  const b = await request.json().catch(() => ({}));
  const sid = String(b.sessionId || "");
  const rows = await sql`SELECT data FROM portal_sessions WHERE id = ${sid} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  const data = (rows[0] as any).data || {};
  const total = Number(data.total) || 0;
  const paid = Number(data.payAmount) || 0;
  const balanceCents = Math.round((total - paid) * 100);
  if (balanceCents <= 0) return NextResponse.json({ error: "No balance is due on this booking." }, { status: 400 });

  const payload = {
    idempotency_key: crypto.randomUUID(),
    quick_pay: { name: "Balance: " + String(data.type || "session").slice(0, 48), price_money: { amount: balanceCents, currency: "USD" }, location_id: locationId },
    checkout_options: { redirect_url: "https://portal.dot1.media/?paid=" + sid + "&kind=balance" },
    payment_note: "Balance for booking " + sid,
    pre_populated_data: { buyer_email: data.clientEmail },
  };
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
  const link = sq.payment_link.url;
  const merged = { ...data, balanceOrderId: sq.payment_link.order_id || "", balanceStatus: "sent", balanceLink: link };
  await sql`UPDATE portal_sessions SET data = ${JSON.stringify(merged)}::jsonb, updated_at = now() WHERE id = ${sid}`;
  await sendEmail({ to: data.clientEmail, subject: "Your balance for " + String(data.type || "your session") + " is ready to pay", html: balanceEmail(data, link, balanceCents / 100), replyTo: "contact@dot1.media" });
  return NextResponse.json({ ok: true, link });
}

