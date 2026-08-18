import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

// Reports whether a client (by email) already has a password set and has signed
// the client-services agreement. Used to decide if an invoice client needs the
// post-payment onboarding (sign + set password) or can go straight to the portal.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = String(searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  try {
    const users = (await sql`SELECT id, password_hash FROM users WHERE email = ${email} LIMIT 1`) as any[];
    if (!users.length) return NextResponse.json({ hasAccount: false, hasPassword: false, signedServices: false });
    const uid = users[0].id;
    const hasPassword = !!users[0].password_hash;
    const signed = (await sql`SELECT 1 FROM agreements WHERE user_id = ${uid} AND agreement_type = 'client_services' LIMIT 1`) as any[];
    return NextResponse.json({ hasAccount: true, hasPassword, signedServices: signed.length > 0 });
  } catch (e) {
    return NextResponse.json({ hasAccount: false, hasPassword: false, signedServices: false });
  }
}
