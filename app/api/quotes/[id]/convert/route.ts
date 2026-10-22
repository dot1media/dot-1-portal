import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { createInvoice } from "@/lib/create-invoice";

export const runtime = "nodejs";

// Convert a quote into a real invoice: runs the exact invoice pipeline (reserves
// the slot, creates the Square retainer link, books the session, emails the client
// with the PDF). Marks the quote converted so it is not sent twice.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { id } = await params;
  const rows = (await sql`SELECT status, data FROM quotes WHERE token = ${id} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  if (rows[0].status === "converted") return NextResponse.json({ error: "This quote has already been converted to an invoice." }, { status: 409 });

  const data = rows[0].data || {};
  const input = data.input || {};
  // Allow last-minute overrides (e.g. the client finally gave a date/time or email).
  const body = await request.json().catch(() => ({}));
  const merged = { ...input, ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined && v !== "")) };

  const r = await createInvoice(merged);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });

  await sql`UPDATE quotes SET data = data || ${JSON.stringify({ convertedAt: Date.now(), invoiceToken: r.invoice?.token, invoiceNo: r.invoice?.no })}::jsonb, status = ${"converted"} WHERE token = ${id}`;
  return NextResponse.json({ ok: true, emailDelivered: r.emailDelivered, emailError: r.emailError, invoice: r.invoice });
}
