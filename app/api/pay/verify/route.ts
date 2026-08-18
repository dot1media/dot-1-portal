import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureLedger } from "@/lib/ledger";
import { receiptPdf } from "@/lib/receipt";
import { receiptEmail, sendEmail, sendToClient, paymentStudioEmail } from "@/lib/email";
import { randomUUID } from "crypto";

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

  const orderId = isCharge ? chargeObj.squareOrderId : isBalance ? data.balanceOrderId : data.squareOrderId;
  const already = isCharge ? chargeObj.status === "paid" : isBalance ? data.balanceStatus === "paid" : data.paymentStatus === "paid";

  // Ensure the ledger exists (full schema) and check whether this order already has a receipt.
  let hasReceipt = false;
  if (orderId) {
    try {
      await ensureLedger();
      const ex = (await sql`SELECT 1 FROM payments WHERE square_order_id = ${orderId} LIMIT 1`) as any[];
      hasReceipt = ex.length > 0;
    } catch (e) { try { console.error("[pay/verify] ledger check:", (e && (e as any).message) || e); } catch (e6) {} }
  }

  // Already paid with a receipt on file: nothing to do.
  if (already && hasReceipt) return NextResponse.json({ paid: true, receipt: "exists" });
  if (!token || !orderId) return NextResponse.json({ paid: already, receipt: hasReceipt ? "exists" : "none" });

  const res = await fetch(squareBase() + "/v2/orders/" + orderId, {
    headers: { "Square-Version": "2026-07-15", Authorization: "Bearer " + token, "Content-Type": "application/json" },
  });
  const od = await res.json().catch(() => ({}));
  const order = od.order || {};
  const paid = already || order.state === "COMPLETED" ||
    (Array.isArray(order.tenders) && order.tenders.length > 0) ||
    (order.net_amount_due_money && Number(order.net_amount_due_money.amount) === 0 && order.total_money && Number(order.total_money.amount) > 0);

  let receipt = hasReceipt ? "exists" : "none";
  if (paid) {
    const tender = (Array.isArray(order.tenders) ? order.tenders[0] : null) || {};
    const cd = (tender.card_details && tender.card_details.card) || {};
    const paidAt = tender.created_at || order.created_at || new Date().toISOString();

    // Mark the session paid if it wasn't already.
    if (!already) {
      let merged: any;
      if (isCharge) {
        merged = { ...data, charges: charges.map((c: any) => (c && c.id === chargeId ? { ...c, status: "paid", paidAt, cardBrand: cd.card_brand || null, cardLast4: cd.last_4 || null } : c)) };
      } else if (isBalance) {
        merged = { ...data, balanceStatus: "paid", payAmount: Number(data.total) || data.payAmount };
      } else {
        merged = { ...data, paymentStatus: "paid" };
      }
      await sql`UPDATE portal_sessions SET data = ${JSON.stringify(merged)}::jsonb, updated_at = now() WHERE id = ${sid}`;
    }

    // If this session was reserved by an invoice, mark that invoice paid too.
    if (!isCharge && !isBalance && data.invoiceToken) {
      try { await sql`UPDATE invoices SET status = 'paid' WHERE token = ${String(data.invoiceToken)}`; } catch (e) {}
    }

    // Record + email the receipt unless one already exists. Backfills payments that were marked
    // paid before the ledger was usable. Isolated so it can never break verification; the outcome
    // is returned in `receipt` so the studio can see exactly what happened.
    if (!hasReceipt) {
      try {
        const amountCents = (order.total_money && Number(order.total_money.amount)) || 0;
        if (amountCents <= 0) {
          receipt = "skipped (no amount from Square yet)";
        } else {
          await ensureLedger();
          const rcptKind = isCharge ? "charge" : isBalance ? "balance" : String(data.payChoice || "deposit");
          const rcptService = isCharge ? chargeObj.label || data.type : data.type;
          const rid = randomUUID(); // must be a valid UUID: the live payments.id column is uuid-typed
          const currency = (order.total_money && order.total_money.currency) || "USD";
          const inserted = (await sql`
            INSERT INTO payments (id, session_id, client_email, client_name, service, kind, amount_cents, currency, card_brand, card_last4, square_order_id, square_payment_id, paid_at)
            VALUES (${rid}, ${sid}, ${data.clientEmail || null}, ${data.clientName || null}, ${rcptService || null}, ${rcptKind}, ${amountCents}, ${currency}, ${cd.card_brand || null}, ${cd.last_4 || null}, ${orderId}, ${tender.payment_id || null}, ${paidAt})
            ON CONFLICT (square_order_id) DO NOTHING RETURNING id`) as any[];
          if (inserted.length > 0) {
            receipt = "recorded";
            try { await sendEmail({ to: data.notifyEmail || "contact@dot1.media", subject: "Payment received \u00b7 $" + (amountCents / 100).toFixed(2) + " from " + (data.clientName || "a client"), html: paymentStudioEmail(data, { amountCents, kind: rcptKind, cardBrand: cd.card_brand, cardLast4: cd.last_4 }), replyTo: data.clientEmail }); } catch (e3) {}
            if (data.clientEmail) {
              const rec: any = { id: rid, client_email: data.clientEmail, client_name: data.clientName, service: rcptService, kind: rcptKind, amount_cents: amountCents, total_cents: Math.round((Number(data.total) || 0) * 100), card_brand: cd.card_brand, card_last4: cd.last_4, paid_at: paidAt };
              let attachments: any = undefined;
              try { attachments = [{ filename: "Dot-One-Media-Receipt.pdf", content: await receiptPdf(rec) }]; } catch (e2) {}
              try { await sendToClient(data.clientEmail, "payments", { subject: "Your Dot One Media receipt", html: receiptEmail(rec), attachments }); }
              catch (e7) { receipt = "recorded (client email failed)"; try { console.error("[pay/verify] client receipt email:", (e7 && (e7 as any).message) || e7); } catch (e8) {} }
            }
          } else {
            receipt = "exists";
          }
        }
      } catch (e) {
        receipt = "error: " + String((e && (e as any).message) || e).slice(0, 180);
        try { console.error("[pay/verify] receipt/email failed:", (e && (e as any).message) || e); } catch (e5) {}
      }
    }
  }
  return NextResponse.json({ paid, receipt });
}

