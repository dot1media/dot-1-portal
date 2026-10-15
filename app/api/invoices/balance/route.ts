import { NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { sendEmail } from "@/lib/email";
import { buildInvoicePdf, invoiceEmailHtml } from "@/lib/invoice-pdf";
import { createRetainerLink } from "@/lib/square-link";

export const runtime = "nodejs";

const money = (cents: number) => "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY, token TEXT UNIQUE NOT NULL, session_id TEXT,
    status TEXT NOT NULL DEFAULT 'sent', data JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  ensured = true;
}

// Balance invoice generated from an existing session: the remaining balance plus any add-ons added
// now, payable in one link. The receipt shows the deposit/retainer already paid as a credit.
export async function POST(request: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureTable();

  const b = await request.json().catch(() => ({}));
  const sid = String(b.sessionId || "");
  if (!sid) return NextResponse.json({ error: "Missing session." }, { status: 400 });
  const note = String(b.note || "").trim().slice(0, 1200);
  const cc = String(b.cc || "").split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)).slice(0, 5);

  const rows = (await sql`SELECT data FROM portal_sessions WHERE id = ${sid} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  const data: any = rows[0].data || {};
  const email = String(data.clientEmail || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "This session has no client email." }, { status: 400 });

  // Add-ons being added now (custom line items).
  const newAddons = (Array.isArray(b.addons) ? b.addons : []).slice(0, 12)
    .map((x: any) => {
      const label = String(x.label || "").trim().slice(0, 80);
      const qty = Math.max(1, Math.min(20, Math.round(Number(x.qty) || 1)));
      const unitCents = Math.max(0, Math.round((Number(x.price) || 0) * 100));
      return { label, qty, unitCents, cents: unitCents * qty };
    })
    .filter((x: any) => x.label && x.cents > 0);
  const newAddonsCents = newAddons.reduce((s: number, a: any) => s + a.cents, 0);

  // Money already collected: the deposit/retainer plus any paid charges.
  const depositCents = Math.round((Number(data.payAmount) || 0) * 100);
  const paidChargesCents = (Array.isArray(data.charges) ? data.charges : [])
    .filter((c: any) => c && c.status === "paid")
    .reduce((s: number, c: any) => s + (Number(c.amountCents) || 0), 0);
  const paidCents = depositCents + paidChargesCents;

  const agreedTotalCents = Math.round((Number(data.total) || 0) * 100);
  const grandTotalCents = agreedTotalCents + newAddonsCents;
  const balanceDueCents = grandTotalCents - paidCents;

  if (balanceDueCents < 100) {
    return NextResponse.json({ error: "The balance due comes to " + money(Math.max(0, balanceDueCents)) + ". It must be at least $1.00 to send a payment link." }, { status: 400 });
  }

  const type = String(data.type || "session");
  const items = [
    { label: type + " — agreed total", cents: agreedTotalCents },
    ...newAddons.map((a: any) => ({ label: a.label + (a.qty > 1 ? " x" + a.qty : "") + " (add-on)", cents: a.cents })),
  ];
  const paidLabel = paidChargesCents > 0
    ? "Paid to date"
    : (data.payChoice === "deposit" ? "Deposit paid" : data.payChoice === "retainer" ? "Retainer paid" : "Paid to date");

  // Square link for the balance. If this fails, nothing is sent.
  const link = await createRetainerLink({
    name: (type + " balance").slice(0, 60),
    amountCents: balanceDueCents,
    redirectUrl: "https://portal.dot1.media/?paid=" + sid + "&kind=balance",
    note: "Dot One Media balance for " + (data.clientName || email),
    buyerEmail: email,
  });
  if (!link.url) {
    return NextResponse.json({ error: (link.error || "Square could not create the payment link.") + " The invoice was not sent." }, { status: link.configured ? 502 : 400 });
  }

  // Persist the invoice, stamp its number.
  const token = "inv_" + crypto.randomBytes(9).toString("hex");
  const ins = (await sql`INSERT INTO invoices (token, session_id, status, data) VALUES (${token}, ${sid}, ${"sent"}, ${JSON.stringify({})}::jsonb) RETURNING id`) as any[];
  const no = "INV-" + String(1000 + (ins[0]?.id || 0));
  const inv = {
    no, kind: "balance", createdAt: Date.now(),
    client: { name: data.clientName || "", email, phone: data.clientPhone || "" },
    service: { name: type, group: data.serviceLine || "video", date: data.date || "", time: data.time || "", duration: data.durationMin || 0 },
    items, totalCents: grandTotalCents, amountPaidCents: paidCents, paidLabel, balanceDueCents,
    payUrl: link.url, notes: note, cc,
  };
  await sql`UPDATE invoices SET data = ${JSON.stringify(inv)}::jsonb WHERE token = ${token}`;

  // Fold the new add-ons into the session and raise its total, and record the balance link so the
  // existing paid-redirect/verify flow (kind=balance) reconciles it.
  const mergedAddons = [
    ...(Array.isArray(data.selectedAddons) ? data.selectedAddons : []),
    ...newAddons.map((a: any) => ({ name: a.label + (a.qty > 1 ? " x" + a.qty : ""), price: a.cents / 100, qty: a.qty, unitPrice: a.unitCents / 100 })),
  ];
  const merged = {
    ...data,
    selectedAddons: mergedAddons,
    total: grandTotalCents / 100,
    balanceOrderId: link.orderId || "",
    balanceStatus: "sent",
    balanceLink: link.url,
    balanceInvoiceNo: no,
  };
  await sql`UPDATE portal_sessions SET data = ${JSON.stringify(merged)}::jsonb, updated_at = now() WHERE id = ${sid}`;

  // Email the client the itemized balance receipt + PDF (invoices are always sent).
  let pdfB64 = "";
  try { const bytes = await buildInvoicePdf(inv); pdfB64 = Buffer.from(bytes).toString("base64"); } catch (e) {}
  const clientSend = await sendEmail({
    to: email,
    cc,
    subject: "Your Dot One Media balance " + no + (data.date ? " for " + data.date : ""),
    html: invoiceEmailHtml(inv),
    replyTo: "contact@dot1.media",
    attachments: pdfB64 ? [{ filename: no + ".pdf", content: pdfB64 }] : undefined,
  });
  try {
    await sendEmail({
      to: data.notifyEmail || "contact@dot1.media",
      subject: "Balance invoice " + no + " sent to " + (data.clientName || email) + " (" + money(balanceDueCents) + ")",
      html: `<p style="font-family:Arial,sans-serif;font-size:14px;color:#33322d">Balance invoice <b>${no}</b> for <b>${type}</b> sent to ${data.clientName || email} (${email}).<br>Total ${money(grandTotalCents)}, paid ${money(paidCents)}, balance ${money(balanceDueCents)}.<br>Pay link: <a href="${link.url}">${link.url}</a></p>`,
    });
  } catch (e) {}

  return NextResponse.json({
    ok: true,
    emailDelivered: clientSend.ok,
    emailError: clientSend.ok ? undefined : clientSend.error,
    session: { total: merged.total, selectedAddons: mergedAddons, balanceStatus: "sent", balanceLink: link.url, balanceInvoiceNo: no },
    invoice: { token, no, balanceDueCents, totalCents: grandTotalCents, amountPaidCents: paidCents },
  });
}
