import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { buildInvoicePdf, invoiceEmailHtml } from "@/lib/invoice-pdf";

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
  if (b.action !== "resend") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const rows = (await sql`SELECT data FROM invoices WHERE token = ${id} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const inv = rows[0].data || {};
  let pdfB64 = "";
  try { const bytes = await buildInvoicePdf(inv); pdfB64 = Buffer.from(bytes).toString("base64"); } catch (e) {}
  await sendEmail({
    to: inv.client && inv.client.email,
    subject: "Your Dot One Media invoice " + inv.no + (inv.service && inv.service.date ? " for " + inv.service.date : ""),
    html: invoiceEmailHtml(inv),
    replyTo: "contact@dot1.media",
    attachments: pdfB64 ? [{ filename: inv.no + ".pdf", content: pdfB64 }] : undefined,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { id } = await params;
  await sql`DELETE FROM invoices WHERE token = ${id}`;
  return NextResponse.json({ ok: true });
}
