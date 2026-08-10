import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

// Record a signed agreement for a user (found by email).
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const agreementType = String(body.agreementType || "client_services").trim();
  const version = String(body.version || "1.0").trim();
  const signedName = String(body.signedName || "").trim();

  if (!email || !signedName) {
    return NextResponse.json({ error: "email and a typed signature are required." }, { status: 400 });
  }

  const users = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (users.length === 0) {
    return NextResponse.json({ error: "No account found with that email." }, { status: 404 });
  }

  const rows = await sql`
    INSERT INTO agreements (user_id, agreement_type, version, signed_name)
    VALUES (${users[0].id}, ${agreementType}, ${version}, ${signedName})
    RETURNING id, agreement_type, version, signed_name, signed_at
  `;
  return NextResponse.json({ agreement: rows[0] });
}

