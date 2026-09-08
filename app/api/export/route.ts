import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
export const runtime = "nodejs";
const cell = (v: any) => { const s = v == null ? "" : (v instanceof Date ? v.toISOString() : String(v)); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
// Payments ledger export (the sessions export already lives client-side in Business Settings)
export async function GET(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const url = new URL(req.url);
  const start = url.searchParams.get("start") || ""; const end = url.searchParams.get("end") || "";
  let rows = (await sql`SELECT id, session_id, client_name, client_email, service, kind, amount_cents, currency, card_brand, card_last4, paid_at FROM payments ORDER BY paid_at DESC`) as any[];
  if (start) rows = rows.filter((r) => !r.paid_at || new Date(r.paid_at) >= new Date(start));
  if (end) rows = rows.filter((r) => !r.paid_at || new Date(r.paid_at) <= new Date(end + "T23:59:59"));
  const header = ["paid_at", "client_name", "client_email", "service", "kind", "amount", "currency", "card", "session_id", "payment_id"];
  const lines = rows.map((r) => [r.paid_at, r.client_name, r.client_email, r.service, r.kind, ((Number(r.amount_cents) || 0) / 100).toFixed(2), r.currency || "USD", ((r.card_brand || "") + " " + (r.card_last4 || "")).trim(), r.session_id, r.id]);
  const total = rows.reduce((a, r) => a + (Number(r.amount_cents) || 0), 0) / 100;
  const csv = [header.join(","), ...lines.map((l) => l.map(cell).join(",")), "", `TOTAL,,,,,${total.toFixed(2)}`].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="dot-one-payments-${(start || "all")}-${(end || "todate")}.csv"` } });
}
