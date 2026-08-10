import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

// Create or update a client profile, keyed by email.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim() || null;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO users (name, email, phone, role)
    VALUES (${name}, ${email}, ${phone}, 'client')
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          phone = COALESCE(EXCLUDED.phone, users.phone)
    RETURNING id, name, email, phone, role, avatar_url
  `;
  return NextResponse.json({ user: rows[0] });
}

// Fetch a profile plus its signed agreements, by email.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = String(searchParams.get("email") || "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  const users = await sql`
    SELECT id, name, email, phone, role, avatar_url
    FROM users WHERE email = ${email} LIMIT 1
  `;
  if (users.length === 0) {
    return NextResponse.json({ user: null, agreements: [] });
  }
  const agreements = await sql`
    SELECT agreement_type, version, signed_name, signed_at
    FROM agreements WHERE user_id = ${users[0].id}
    ORDER BY signed_at DESC
  `;
  return NextResponse.json({ user: users[0], agreements });
}

