import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { receiptPdf } from "@/lib/receipt";
import { receiptEmail, sendEmail } from "@/lib/email";

export const runtime = "nodejs";

async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return !!verifyToken(store.get(ADMIN_COOKIE)?.value);
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await sql`CREATE TABLE IF NOT EXISTS payments (id text PRIMARY KEY, session_id text NOT NULL, client_email text, client_name text, service text, kind text, amount_cents integer NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'USD', card_brand text, card_last4 text, square_order_id text, square_payment_id text, paid_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now())`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS payments_order_uidx ON payments(square_order_id)`;
    const rows = (await sql`SELECT id, session_id, client_email, client_name, service, kind, amount_cents, currency, card_brand, card_last4, paid_at FROM payments ORDER BY paid_at DESC LIMIT 500`) as any[];
    return NextResponse.json({ payments: rows });
  } catch (e) {
    return NextResponse.json({ payments: [] });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  let rows: any[];
  try { rows = (await sql`SELECT * FROM payments WHERE id = ${id} LIMIT 1`) as any[]; }
  catch (e) { return NextResponse.json({ error: "Could not load the receipt." }, { status: 500 }); }
  if (!rows || rows.length === 0) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  const p = rows[0];
  if (!p.client_email) return NextResponse.json({ error: "This receipt has no client email on file." }, { status: 400 });
  try {
    let attachments: any = undefined;
    try { attachments = [{ filename: "Dot-One-Media-Receipt.pdf", content: await receiptPdf(p) }]; } catch (e2) {}
    await sendEmail({ to: p.client_email, subject: "Your Dot One Media receipt", html: receiptEmail(p), attachments });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Could not send the receipt." }, { status: 500 });
  }
}

