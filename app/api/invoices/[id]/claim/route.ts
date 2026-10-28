import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

// Re-point an invoice's booking to the person who actually pays and signs, so
// they own the portal account and can see the session, even when the invoice
// was emailed to someone else (a coordinator, assistant, or contact who is not
// the owner). Authorized by possession of the invoice token (a secret, in the
// paid-return link) plus the matching session id, so a stranger cannot reassign
// someone else's booking. The studio copy and invoice history keep the original
// recipient; this only sets who owns the account going forward.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // invoice token
  const body = await request.json().catch(() => ({}));
  const sessionId = String(body.sessionId || "");
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const emailOk = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(email) && email.indexOf("..") === -1 && email.length <= 254;
  if (!sessionId || !emailOk) return NextResponse.json({ error: "A session id and a valid email are required." }, { status: 400 });

  const rows = (await sql`SELECT token, session_id FROM invoices WHERE token = ${id} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  if (rows[0].session_id !== sessionId) return NextResponse.json({ error: "This invoice does not match that booking." }, { status: 403 });

  // Own the booking under the signer's email. onboardedEmail marks it claimed so
  // the paid-return flow won't send a later visitor back through onboarding.
  const patch: Record<string, any> = { clientEmail: email, onboardedEmail: email };
  if (name) patch.clientName = name;
  await sql`UPDATE portal_sessions SET client_email = ${email}, data = data || ${JSON.stringify(patch)}::jsonb WHERE id = ${sessionId}`;

  const invPatch: Record<string, any> = { ownerEmail: email };
  if (name) invPatch.ownerName = name;
  await sql`UPDATE invoices SET data = data || ${JSON.stringify(invPatch)}::jsonb WHERE token = ${id}`;

  return NextResponse.json({ ok: true });
}
