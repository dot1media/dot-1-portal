import { NextResponse } from "next/server";
import { ensureReferralSchema, newCode } from "@/lib/referral";
import { sql } from "@/lib/db";
import { hashPassword, makeClientToken, CLIENT_COOKIE } from "@/lib/auth";
import { hasStudio } from "@/lib/studioGuard";

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
  try { await ensureReferralSchema(); const em = String(email || "").toLowerCase(); if (em) { const has = ((await sql`SELECT 1 FROM referral_codes WHERE client_email = ${em} LIMIT 1`) as any[])[0]; if (!has) for (let i = 0; i < 5; i++) { try { await sql`INSERT INTO referral_codes (code, client_email) VALUES (${newCode()}, ${em})`; break; } catch {} } } } catch {}
  const res = NextResponse.json({ user: rows[0] });
  res.cookies.set(CLIENT_COOKIE, makeClientToken(email), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Studio-only: list every client account so the admin can browse accounts rather than guess an
  // email. Useful when an invoice is paid/forwarded by someone other than the original recipient and
  // the account ends up under a different email than expected.
  if (searchParams.get("all") === "1" || searchParams.get("list") === "1") {
    if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    let rows: any[] = [];
    try {
      rows = (await sql`
        SELECT id, name, email, phone, role, avatar_url, created_at,
               (password_hash IS NOT NULL) AS has_password
        FROM users
        WHERE role = 'client' OR role IS NULL
        ORDER BY created_at DESC NULLS LAST, email ASC
      `) as any[];
    } catch {
      // created_at may not exist on older schemas — fall back without it.
      rows = (await sql`
        SELECT id, name, email, phone, role, avatar_url,
               (password_hash IS NOT NULL) AS has_password
        FROM users
        WHERE role = 'client' OR role IS NULL
        ORDER BY email ASC
      `) as any[];
    }
    return NextResponse.json({ users: rows, count: rows.length });
  }

  const email = String(searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  const users = await sql`SELECT id, name, email, phone, role, avatar_url FROM users WHERE email = ${email} LIMIT 1`;
  if (users.length === 0) return NextResponse.json({ user: null, agreements: [] });
  const agreements = await sql`SELECT id, agreement_type, version, signed_name, usage_option, signed_at FROM agreements WHERE user_id = ${users[0].id} ORDER BY signed_at DESC`;
  return NextResponse.json({ user: users[0], agreements });
}


