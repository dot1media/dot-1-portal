import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyClientToken, CLIENT_COOKIE } from "@/lib/auth";
import crypto from "crypto";

export const runtime = "nodejs";

function squareBase() {
  return process.env.SQUARE_ENV === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
}

export async function POST(request: Request) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!token || !locationId) return NextResponse.json({ configured: false });

  const store = await cookies();
  const client = verifyClientToken(store.get(CLIENT_COOKIE)?.value);
  if (!client) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await request.json().catch(() => ({}));
  const sessionId = String(b.sessionId || "");
  const amount = Math.round((Number(b.amount) || 0) * 100); // dollars -> cents
  const label = String(b.label || "Dot One Media session").slice(0, 60);
  if (!sessionId || amount <= 0) return NextResponse.json({ error: "Invalid payment." }, { status: 400 });

  const payload = {
    idempotency_key: crypto.randomUUID(),
    quick_pay: { name: label, price_money: { amount, currency: "USD" }, location_id: locationId },
    checkout_options: { redirect_url: "https://portal.dot1.media/?paid=" + sessionId },
    payment_note: "Dot One Media booking " + sessionId,
    pre_populated_data: { buyer_email: client.email },
  };
  const res = await fetch(squareBase() + "/v2/online-checkout/payment-links", {
    method: "POST",
    headers: { "Square-Version": "2026-07-15", Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.payment_link || !data.payment_link.url) {
    return NextResponse.json({ error: "Could not start checkout." }, { status: 502 });
  }
  const orderId = data.payment_link.order_id || "";
  const rows = await sql`SELECT data FROM portal_sessions WHERE id = ${sessionId} LIMIT 1`;
  if (rows.length) {
    const merged = { ...(rows[0] as any).data, squareOrderId: orderId, paymentStatus: "pending", payAmount: amount / 100 };
    await sql`UPDATE portal_sessions SET data = ${JSON.stringify(merged)}::jsonb, updated_at = now() WHERE id = ${sessionId}`;
  }
  return NextResponse.json({ url: data.payment_link.url });
}

