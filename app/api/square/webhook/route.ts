import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

// Public base URL of the portal. Used for (a) rebuilding the exact notification URL that
// Square signs against, and (b) calling our own verify endpoint. Override with PORTAL_URL if needed.
const SITE = (process.env.PORTAL_URL || "https://portal.dot1.media").trim().replace(/\/+$/, "");

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try { return crypto.timingSafeEqual(ab, bb); } catch (e) { return false; }
}

// Square calls this endpoint whenever a payment is created or updated. This is the primary,
// server-to-server way payments get recorded, independent of the client's browser redirect.
// It stays fully compatible with the existing paths (redirect verify, client auto-reconcile,
// studio Check button): everything funnels through /api/pay/verify, which is idempotent.
export async function POST(request: Request) {
  const key = (process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "").trim();
  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature") || "";

  // Without a configured signature key we cannot trust the request, so reject it.
  if (!key) return NextResponse.json({ ok: false, error: "not configured" }, { status: 401 });
  const notificationUrl = SITE + "/api/square/webhook";
  const expected = crypto.createHmac("sha256", key).update(notificationUrl + body).digest("base64");
  if (!safeEqual(signature, expected)) return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });

  let evt: any = {};
  try { evt = JSON.parse(body); } catch (e) { return NextResponse.json({ ok: true }); }
  const type = String(evt.type || "");
  if (type !== "payment.created" && type !== "payment.updated") return NextResponse.json({ ok: true });

  const payment = evt && evt.data && evt.data.object && evt.data.object.payment;
  const orderId = payment && payment.order_id ? String(payment.order_id) : "";
  if (!orderId) return NextResponse.json({ ok: true });

  try {
    // Find the session that owns this Square order, across deposit, balance, and ad-hoc charges.
    const chargeMatch = JSON.stringify([{ squareOrderId: orderId }]);
    const rows = (await sql`
      SELECT id, data FROM portal_sessions
      WHERE data->>'squareOrderId' = ${orderId}
         OR data->>'balanceOrderId' = ${orderId}
         OR data->'charges' @> ${chargeMatch}::jsonb
      LIMIT 1`) as any[];
    if (rows.length === 0) return NextResponse.json({ ok: true }); // unknown order, nothing to do

    const sid = rows[0].id;
    const data = rows[0].data || {};
    let kind = "deposit";
    let chargeId = "";
    if (data.balanceOrderId === orderId) kind = "balance";
    else if (data.squareOrderId === orderId) kind = "deposit";
    else {
      const c = (Array.isArray(data.charges) ? data.charges : []).find((x: any) => x && x.squareOrderId === orderId);
      if (c) { kind = "charge"; chargeId = c.id; }
    }

    // Hand off to the idempotent verify endpoint, which re-confirms with Square, marks the
    // record paid, records the receipt, and emails it. Safe to call repeatedly.
    const url = SITE + "/api/pay/verify?sid=" + encodeURIComponent(sid) + "&kind=" + encodeURIComponent(kind) + (chargeId ? "&charge=" + encodeURIComponent(chargeId) : "");
    await fetch(url).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Let Square retry transient failures; the backup paths also catch anything missed.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

