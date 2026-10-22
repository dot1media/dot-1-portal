import crypto from "crypto";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildInvoicePdf, invoiceEmailHtml } from "@/lib/invoice-pdf";
import { createRetainerLink } from "@/lib/square-link";

// Shared invoice creation, used by POST /api/invoices and by quote -> invoice
// conversion so both follow the exact same path: resolve the catalog, reserve
// the slot, create the Square retainer link, persist the session + invoice, and
// email the client with the PDF attached.

export const money = (cents: number) =>
  "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let ensured = false;
export async function ensureInvoiceTable() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    session_id TEXT,
    status TEXT NOT NULL DEFAULT 'sent',
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  ensured = true;
}

export interface InvoiceResult {
  ok: boolean;
  status: number;
  error?: string;
  invoice?: any;
  emailDelivered?: boolean;
  emailError?: string;
}

// Resolve service + add-ons + custom lines from the authoritative catalog and
// compute line items and totals. Shared by invoices and quotes.
export async function resolveLineItems(b: any): Promise<{ ok: boolean; status: number; error?: string; svc?: any; grp?: string; addons?: any[]; custom?: any[]; items?: any[]; totalCents?: number; retainerCents?: number }> {
  const serviceId = String(b.serviceId || "");
  if (!serviceId) return { ok: false, status: 400, error: "A service is required." };
  const svcRows = (await sql`SELECT id, grp, name, price_cents, duration_min FROM services WHERE id = ${serviceId} LIMIT 1`) as any[];
  if (!svcRows.length) return { ok: false, status: 400, error: "That service no longer exists." };
  const svc = svcRows[0];
  const addonReq: Array<{ id: string; qty: number }> = Array.isArray(b.addons)
    ? b.addons.map((x: any) => ({ id: String(x.id || ""), qty: Math.max(1, Math.min(20, Math.round(Number(x.qty) || 1))) })).filter((x: any) => x.id).slice(0, 20)
    : (Array.isArray(b.addonIds) ? b.addonIds.map((id: any) => ({ id: String(id), qty: 1 })).slice(0, 20) : []);
  let addons: any[] = [];
  if (addonReq.length) {
    const rows = (await sql`SELECT id, name, price_cents FROM addons WHERE id = ANY(${addonReq.map((x) => x.id)})`) as any[];
    const qtyOf: Record<string, number> = {};
    addonReq.forEach((x) => { qtyOf[x.id] = x.qty; });
    addons = rows.map((r: any) => ({ ...r, qty: qtyOf[r.id] || 1 }));
  }
  const custom = (Array.isArray(b.custom) ? b.custom : []).slice(0, 12)
    .map((x: any) => ({ label: String(x.label || "").trim().slice(0, 80), cents: Math.max(0, Math.round((Number(x.price) || 0) * 100)) }))
    .filter((x: any) => x.label);
  const items = [
    { label: svc.name + " (session)", cents: svc.price_cents || 0 },
    ...addons.map((a) => ({ label: a.name + " (add-on" + (a.qty > 1 ? " x" + a.qty : "") + ")", cents: (a.price_cents || 0) * (a.qty || 1) })),
    ...custom,
  ];
  const totalCents = items.reduce((s, it) => s + (it.cents || 0), 0);
  const retainerCents = Math.round(totalCents / 2);
  return { ok: true, status: 200, svc, grp: svc.grp || "video", addons, custom, items, totalCents, retainerCents };
}

export async function createInvoice(b: any): Promise<InvoiceResult> {
  await ensureInvoiceTable();
  const name = String(b.name || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  const phone = String(b.phone || "").trim().slice(0, 40);
  const date = String(b.date || "");
  const time = String(b.time || "");
  const notes = String(b.notes || "").trim().slice(0, 1200);
  const cc = String(b.cc || "").split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && e !== email).slice(0, 5);
  const emailOk = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(email) && email.indexOf("..") === -1 && email.length <= 254;
  if (!name || !emailOk || !b.serviceId || !date || !time) {
    return { ok: false, status: 400, error: "Name, a valid email, service, date, and time are required." };
  }

  const r = await resolveLineItems(b);
  if (!r.ok) return { ok: false, status: r.status, error: r.error };
  const { svc, grp, addons, items, totalCents, retainerCents } = r as Required<typeof r>;
  if (totalCents <= 0) return { ok: false, status: 400, error: "The invoice total must be greater than zero." };

  const clash = (await sql`SELECT 1 FROM portal_sessions WHERE date = ${date} AND time = ${time} AND status = 'active' LIMIT 1`) as any[];
  if (clash.length) return { ok: false, status: 409, error: "That date and time is already booked. Pick another slot." };

  const sessionId = "ses_inv_" + crypto.randomBytes(5).toString("hex");
  const token = "inv_" + crypto.randomBytes(9).toString("hex");
  const session: any = {
    id: sessionId, clientName: name, clientEmail: email, clientPhone: phone, clientImage: "",
    notifyEmail: "contact@dot1.media", type: svc.name, serviceLine: grp,
    photographer: grp === "photo" ? "Brittany Matthews" : "Dennis Matthews",
    date, time, location: "", status: "active",
    durationMin: svc.duration_min || 60, apptMin: svc.duration_min || 60, padBefore: 0, padAfter: 0,
    currentStage: 0, stageTimes: { 0: "just now" }, comments: [],
    selectedAddons: addons.map((a) => ({ id: a.id, name: a.name + (a.qty > 1 ? " x" + a.qty : ""), price: ((a.price_cents || 0) * (a.qty || 1)) / 100, qty: a.qty || 1, unitPrice: (a.price_cents || 0) / 100 })),
    total: totalCents / 100, payChoice: "retainer", paymentStatus: "pending", payAmount: retainerCents / 100,
    reviewLink: "", deliveryVideo: "", deliveryPhoto: "", deliveryMusic: "", deliveryGov: "",
    invoiceNo: "", invoiceToken: token, source: "invoice",
  };

  const link = await createRetainerLink({
    name: svc.name + " retainer",
    amountCents: retainerCents,
    redirectUrl: "https://portal.dot1.media/?paid=" + sessionId,
    note: "Dot One Media invoice for " + name,
    buyerEmail: email,
  });
  if (!link.url) {
    return { ok: false, status: link.configured ? 502 : 400, error: (link.error || "Square could not create the payment link.") + " The invoice was not sent." };
  }
  const payUrl = link.url;
  session.squareOrderId = link.orderId || "";

  await sql`INSERT INTO portal_sessions (id, client_email, date, time, status, data)
            VALUES (${sessionId}, ${email}, ${date}, ${time}, ${"active"}, ${JSON.stringify(session)}::jsonb)`;

  const ins = (await sql`INSERT INTO invoices (token, session_id, status, data)
    VALUES (${token}, ${sessionId}, ${"sent"}, ${JSON.stringify({})}::jsonb) RETURNING id`) as any[];
  const no = "INV-" + String(1000 + (ins[0]?.id || 0));
  const inv = {
    no, createdAt: Date.now(),
    client: { name, email, phone },
    service: { id: svc.id, name: svc.name, group: grp, date, time, duration: svc.duration_min || 60 },
    items, totalCents, retainerCents, payUrl, notes, cc,
  };
  await sql`UPDATE invoices SET data = ${JSON.stringify(inv)}::jsonb WHERE token = ${token}`;
  await sql`UPDATE portal_sessions SET data = data || ${JSON.stringify({ invoiceNo: no })}::jsonb WHERE id = ${sessionId}`;

  let pdfB64 = "";
  try { const bytes = await buildInvoicePdf(inv); pdfB64 = Buffer.from(bytes).toString("base64"); } catch (e) {}
  const clientSend = await sendEmail({
    to: email, cc,
    subject: "Your Dot One Media invoice " + no + (date ? " for " + date : ""),
    html: invoiceEmailHtml(inv),
    replyTo: "contact@dot1.media",
    attachments: pdfB64 ? [{ filename: no + ".pdf", content: pdfB64 }] : undefined,
  });
  await sendEmail({
    to: "contact@dot1.media",
    subject: "Invoice " + no + " sent to " + name + " (" + money(retainerCents) + " retainer)",
    html: `<p style="font-family:Arial,sans-serif;font-size:14px;color:#33322d">Invoice <b>${no}</b> for <b>${inv.service.name}</b> on <b>${date} at ${time}</b> was sent to ${name} (${email}). Total ${money(totalCents)}, retainer ${money(retainerCents)}. Payment link: <a href="${payUrl}">${payUrl}</a></p>`,
  });

  return { ok: true, status: 200, invoice: { token, sessionId, status: "sent", ...inv }, emailDelivered: clientSend.ok, emailError: clientSend.ok ? undefined : clientSend.error };
}
