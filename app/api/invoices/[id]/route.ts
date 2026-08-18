import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { buildInvoicePdf, invoiceEmailHtml } from "@/lib/invoice-pdf";
import { createRetainerLink } from "@/lib/square-link";

export const runtime = "nodejs";

async function isAdmin() { const store = await cookies(); return !!verifyToken(store.get(ADMIN_COOKIE)?.value); }

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { id } = await params;
  const rows = (await sql`SELECT id, token, session_id, status, data, created_at FROM invoices WHERE token = ${id} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const r = rows[0];
  return NextResponse.json({ invoice: { id: r.id, token: r.token, sessionId: r.session_id, status: r.status, createdAt: r.created_at, ...(r.data || {}) } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { id } = await params;
  const b = await request.json().catch(() => ({}));
  if (b.action !== "resend" && b.action !== "createlink") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const rows = (await sql`SELECT session_id, data FROM invoices WHERE token = ${id} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const inv = rows[0].data || {};

  if (b.action === "createlink") {
    // Repair an invoice that went out without a payment link.
    if (inv.payUrl) return NextResponse.json({ ok: true, payUrl: inv.payUrl });
    const sessionId = rows[0].session_id || "";
    const link = await createRetainerLink({
      name: ((inv.service && inv.service.name) || "Dot One Media session") + " retainer",
      amountCents: Number(inv.retainerCents) || 0,
      redirectUrl: "https://portal.dot1.media/?paid=" + sessionId,
      note: "Dot One Media invoice " + (inv.no || ""),
      buyerEmail: inv.client && inv.client.email,
    });
    if (!link.url) return NextResponse.json({ error: link.error || "Square could not create the payment link." }, { status: link.configured ? 502 : 400 });
    inv.payUrl = link.url;
    await sql`UPDATE invoices SET data = ${JSON.stringify(inv)}::jsonb WHERE token = ${id}`;
    if (sessionId) {
      try { await sql`UPDATE portal_sessions SET data = data || ${JSON.stringify({ squareOrderId: link.orderId || "", paymentStatus: "pending" })}::jsonb WHERE id = ${sessionId}`; } catch (e) {}
    }
    return NextResponse.json({ ok: true, payUrl: link.url });
  }
  let pdfB64 = "";
  try { const bytes = await buildInvoicePdf(inv); pdfB64 = Buffer.from(bytes).toString("base64"); } catch (e) {}
  const sent = await sendEmail({
    to: inv.client && inv.client.email,
    subject: "Your Dot One Media invoice " + inv.no + (inv.service && inv.service.date ? " for " + inv.service.date : ""),
    html: invoiceEmailHtml(inv),
    replyTo: "contact@dot1.media",
    attachments: pdfB64 ? [{ filename: inv.no + ".pdf", content: pdfB64 }] : undefined,
  });
  if (!sent.ok) return NextResponse.json({ error: "Could not deliver the email: " + (sent.error || "unknown reason") }, { status: 502 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { id } = await params;
  await sql`DELETE FROM invoices WHERE token = ${id}`;
  return NextResponse.json({ ok: true });
}
