import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createInvoice } from "@/lib/create-invoice";

export const runtime = "nodejs";

// Public (token-gated): view a quote and accept it. Accepting runs the exact invoice
// pipeline (books the slot, Square link, emails the invoice) and returns the pay URL so
// the client goes straight to payment, then into the normal onboarding/booking flow.

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "Missing link." }, { status: 400 });
  const rows = (await sql`SELECT status, data FROM quotes WHERE token = ${token} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "This quote link is not valid." }, { status: 404 });
  const d = rows[0].data || {};
  const expired = d.validUntil ? Date.now() > Number(d.validUntil) : false;
  return NextResponse.json({
    status: rows[0].status, expired,
    quote: {
      no: d.no, client: d.client, service: d.service, items: d.items,
      totalCents: d.totalCents, retainerCents: d.retainerCents, validUntil: d.validUntil, notes: d.notes,
    },
  });
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const token = String(b.token || "");
  if (!token) return NextResponse.json({ error: "Missing link." }, { status: 400 });
  const rows = (await sql`SELECT status, data FROM quotes WHERE token = ${token} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "This quote link is not valid." }, { status: 404 });
  if (rows[0].status === "converted") {
    return NextResponse.json({ error: "This quote has already been accepted. Check your email for the invoice and payment link." }, { status: 409 });
  }
  const d = rows[0].data || {};
  const input = d.input || {};
  if (!input.email || !input.date || !input.time) {
    return NextResponse.json({ error: "This quote needs a few details finalized before online booking. Please reply to the studio and we'll send your invoice." }, { status: 400 });
  }

  const r = await createInvoice(input);
  if (!r.ok) return NextResponse.json({ error: r.error || "Could not accept the quote." }, { status: r.status || 400 });

  await sql`UPDATE quotes SET status = 'converted', data = data || ${JSON.stringify({ acceptedAt: Date.now(), convertedAt: Date.now(), invoiceToken: r.invoice?.token, invoiceNo: r.invoice?.no })}::jsonb WHERE token = ${token}`;
  return NextResponse.json({ ok: true, payUrl: r.invoice?.payUrl || "" });
}
