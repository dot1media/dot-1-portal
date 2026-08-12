import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { receiptPdf } from "@/lib/receipt";
import { receiptEmail, sendEmail, sendToClient, paymentStudioEmail } from "@/lib/email";

export const runtime = "nodejs";

function squareBase() {
  return (process.env.SQUARE_ENV || "").trim() === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
}

export async function GET(request: Request) {
  const token = (process.env.SQUARE_ACCESS_TOKEN || "").trim();
  const { searchParams } = new URL(request.url);
  const sid = String(searchParams.get("sid") || "");
  const kind = String(searchParams.get("kind") || "");
  const isBalance = kind === "balance";
  const isCharge = kind === "charge";
  const chargeId = String(searchParams.get("charge") || "");
  if (!sid) return NextResponse.json({ error: "Missing sid." }, { status: 400 });

  const rows = await sql`SELECT data FROM portal_sessions WHERE id = ${sid} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ paid: false });
  const data = (rows[0] as any).data || {};

  const charges: any[] = Array.isArray(data.charges) ? data.charges : [];
  const chargeObj = isCharge ? charges.find((c: any) => c && c.id === chargeId) : null;
  if (isCharge && !chargeObj) return NextResponse.json({ paid: false });

  const already = isCharge ? chargeObj.status === "paid" : isBalance ? data.balanceStatus === "paid" : data.paymentStatus === "paid";
  if (already) return NextResponse.json({ paid: true });

  const orderId = isCharge ? chargeObj.squareOrderId : isBalance ? data.balanceOrderId : data.squareOrderId;
  if (!token || !orderId) return NextResponse.json({ paid: false });

  const res = await fetch(squareBase() + "/v2/orders/" + orderId, {
    headers: { "Square-Version": "2026-07-15", Authorization: "Bearer " + token, "Content-Type": "application/json" },
  });
  const od = await res.json().catch(() => ({}));
  const order = od.order || {};
  const paid = order.state === "COMPLETED" ||
    (Array.isArray(order.tenders) && order.tenders.length > 0) ||
    (order.net_amount_due_money && Number(order.net_amount_due_money.amount) === 0 && order.total_money && Number(order.total_money.amount) > 0);
  if (paid) {
    const tender = (Array.isArray(order.tenders) ? order.tenders[0] : null) || {};
    const cd = (tender.card_details && tender.card_details.card) || {};
    const paidAt = tender.created_at || order.created_at || new Date().toISOString();

    let merged: any;
    if (isCharge) {
      merged = { ...data, charges: charges.map((c: any) => (c && c.id === chargeId ? { ...c, status: "paid", paidAt, cardBrand: cd.card_brand || null, cardLast4: cd.last_4 || null } : c)) };
    } else if (isBalance) {
      merged = { ...data, balanceStatus: "paid", payAmount: Number(data.total) || data.payAmount };
    } else {
      merged = { ...data, paymentStatus: "paid" };
    }
    await sql`UPDATE portal_sessions SET data = ${JSON.stringify(merged)}::jsonb, updated_at = now() WHERE id = ${sid}`;

    // Record a receipt + email it to the client. Fully isolated: this can never break payment verification.
    try {
      const amountCents = (order.total_money && Number(order.total_money.amount)) || 0;
      const rcptKind = isCharge ? "charge" : isBalance ? "balance" : String(data.payChoice || "deposit");
      const rcptService = isCharge ? chargeObj.label || data.type : data.type;
      const rid = "rcpt_" + Math.random().toString(36).slice(2, 12);
      const currency = (order.total_money && order.total_money.currency) || "USD";
      const inserted = (await sql`
        INSERT INTO payments (id, session_id, client_email, client_name, service, kind, amount_cents, currency, card_brand, card_last4, square_order_id, square_payment_id, paid_at)
        VALUES (${rid}, ${sid}, ${data.clientEmail || null}, ${data.clientName || null}, ${rcptService || null}, ${rcptKind}, ${amountCents}, ${currency}, ${cd.card_brand || null}, ${cd.last_4 || null}, ${orderId}, ${tender.payment_id || null}, ${paidAt})
        ON CONFLICT (square_order_id) DO NOTHING RETURNING id`) as any[];
      if (inserted.length > 0) {
        try { await sendEmail({ to: data.notifyEmail || "contact@dot1.media", subject: "Payment received \u00b7 $" + (amountCents / 100).toFixed(2) + " from " + (data.clientName || "a client"), html: paymentStudioEmail(data, { amountCents, kind: rcptKind, cardBrand: cd.card_brand, cardLast4: cd.last_4 }), replyTo: data.clientEmail }); } catch (e3) {}
        if (data.clientEmail) {
          const rec: any = { id: rid, client_email: data.clientEmail, client_name: data.clientName, service: rcptService, kind: rcptKind, amount_cents: amountCents, card_brand: cd.card_brand, card_last4: cd.last_4, paid_at: paidAt };
          let attachments: any = undefined;
          try { attachments = [{ filename: "Dot-One-Media-Receipt.pdf", content: await receiptPdf(rec) }]; } catch (e2) {}
          await sendToClient(data.clientEmail, "payments", { subject: "Your Dot One Media receipt", html: receiptEmail(rec), attachments });
        }
      }
    } catch (e) { /* never break payment verification */ }
  }
  return NextResponse.json({ paid });
}

