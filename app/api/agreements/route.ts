import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyClientToken, CLIENT_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

// Return the signed agreements for the logged-in client (found via their session cookie).
export async function GET() {
  const store = await cookies();
  const v = verifyClientToken(store.get(CLIENT_COOKIE)?.value);
  const email = v?.email ? String(v.email).trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ agreements: [] });
  try {
    const users = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (users.length === 0) return NextResponse.json({ agreements: [] });
    const userId = users[0].id as string;
    const rows = await sql`
      SELECT id, agreement_type, version, signed_name, usage_option, signed_at
      FROM agreements WHERE user_id = ${userId} ORDER BY signed_at DESC`;
    return NextResponse.json({ agreements: rows });
  } catch (e) {
    return NextResponse.json({ agreements: [] });
  }
}

// Record one or more signed agreements for a user (found by email).
// Accepts a batch: { email, signedName, agreements: [{ type, version, usageOption, details }] }
// Also accepts the older single form: { email, signedName, agreementType, version, ... }
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const signedName = String(body.signedName || "").trim();

  let items = Array.isArray(body.agreements) ? body.agreements : null;
  if (!items) {
    items = [{
      type: body.agreementType || "client_services",
      version: body.version || "1.0",
      usageOption: body.usageOption,
      details: body.details,
    }];
  }

  if (!email || !signedName) {
    return NextResponse.json({ error: "email and a typed signature are required." }, { status: 400 });
  }

  const users = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (users.length === 0) {
    return NextResponse.json({ error: "No account found with that email." }, { status: 404 });
  }
  const userId = users[0].id as string;

  const recorded = [];
  for (const it of items) {
    const type = String((it && it.type) || "").trim();
    if (!type) continue;
    const version = String((it && it.version) || "1.0").trim();
    const usageOption = it && it.usageOption ? String(it.usageOption).trim() : null;
    const details = it && it.details ? JSON.stringify(it.details) : null;
    const rows = await sql`
      INSERT INTO agreements (user_id, agreement_type, version, signed_name, usage_option, details)
      VALUES (${userId}, ${type}, ${version}, ${signedName}, ${usageOption}, ${details}::jsonb)
      RETURNING id, agreement_type, version, usage_option, signed_at
    `;
    recorded.push(rows[0]);
  }

  return NextResponse.json({ agreements: recorded });
}

