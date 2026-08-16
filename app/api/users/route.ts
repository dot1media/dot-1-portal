import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, makeClientToken, CLIENT_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim() || null;
  const password = String(body.password || "");

  if (!name || !email) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });

  if (password && password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  const passwordHash = password ? hashPassword(password) : null;
  const rows = await sql`
    INSERT INTO users (name, email, phone, role, password_hash)
    VALUES (${name}, ${email}, ${phone}, 'client', ${passwordHash})
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name, phone = COALESCE(EXCLUDED.phone, users.phone),
          password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash)
    RETURNING id, name, email, phone, role, avatar_url
  `;
  const res = NextResponse.json({ user: rows[0] });
  res.cookies.set(CLIENT_COOKIE, makeClientToken(email), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = String(searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  const users = await sql`SELECT id, name, email, phone, role, avatar_url FROM users WHERE email = ${email} LIMIT 1`;
  if (users.length === 0) return NextResponse.json({ user: null, agreements: [] });
  const agreements = await sql`SELECT agreement_type, version, signed_name, signed_at FROM agreements WHERE user_id = ${users[0].id} ORDER BY signed_at DESC`;
  return NextResponse.json({ user: users[0], agreements });
}


