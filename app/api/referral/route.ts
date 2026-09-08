import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { currentClientEmail } from "@/lib/gallery";
import { ensureReferralSchema, creditDollars, newCode } from "@/lib/referral";
import { PORTAL_ROOT } from "@/lib/portal/constants";
export const runtime = "nodejs";
export async function GET() {
  const em = await currentClientEmail();
  if (!em) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  await ensureReferralSchema();
  let row = ((await sql`SELECT code FROM referral_codes WHERE client_email = ${em} LIMIT 1`) as any[])[0];
  if (!row) { for (let i = 0; i < 5 && !row; i++) { const code = newCode(); try { await sql`INSERT INTO referral_codes (code, client_email) VALUES (${code}, ${em})`; row = { code }; } catch {} } }
  if (!row) return NextResponse.json({ error: "Could not create a code." }, { status: 500 });
  const c = ((await sql`SELECT COUNT(*)::int AS n FROM referrals WHERE referrer_email = ${em}`) as any[])[0];
  const count = Number(c?.n) || 0; const credit = creditDollars();
  return NextResponse.json({ code: row.code, link: PORTAL_ROOT + "?ref=" + row.code, count, credit, earned: count * credit });
}
