import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { createInvoice, ensureInvoiceTable } from "@/lib/create-invoice";

export const runtime = "nodejs";

async function isAdmin() { return await hasStudio(); }

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureInvoiceTable();
  const rows = (await sql`SELECT id, token, session_id, status, data, created_at FROM invoices ORDER BY created_at DESC LIMIT 200`) as any[];
  return NextResponse.json({ invoices: rows.map((r) => ({ id: r.id, token: r.token, sessionId: r.session_id, status: r.status, createdAt: r.created_at, ...(r.data || {}) })) });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const r = await createInvoice(b);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true, emailDelivered: r.emailDelivered, emailError: r.emailError, invoice: r.invoice });
}
