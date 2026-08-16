import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyInviteToken, hashPassword, makeClientToken, CLIENT_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

// Accept a portal invite: verify the signed token, create (or update) the client's account,
// and sign them in so their existing session (linked by email) shows up immediately.
export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const token = String(b.token || "");
  const password = String(b.password || "");
  const typedName = String(b.name || "").trim();

  const v = verifyInviteToken(token);
  if (!v || !v.email) return NextResponse.json({ error: "This invite link is invalid or has expired. Please ask the studio to send a new one." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const email = v.email.toLowerCase();
  const name = typedName || v.name || "";

  await sql`
    INSERT INTO users (name, email, phone, role, password_hash)
    VALUES (${name}, ${email}, ${null}, 'client', ${hashPassword(password)})
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          name = CASE WHEN COALESCE(users.name, '') = '' THEN EXCLUDED.name ELSE users.name END
  `;

  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(CLIENT_COOKIE, makeClientToken(email), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}

