import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword, makeClientToken, CLIENT_COOKIE } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  const ip = clientIp(request);
  if (!(await rateLimit(`clogin:ip:${ip}`, 30, 600)) || !(await rateLimit(`clogin:acct:${email}`, 8, 600))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }
  const users = await sql`SELECT id, name, email, password_hash FROM users WHERE email = ${email} LIMIT 1`;
  if (users.length === 0 || !users[0].password_hash) {
    return NextResponse.json({ error: "No account found with that email and password." }, { status: 401 });
  }
  if (!verifyPassword(password, users[0].password_hash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, name: users[0].name, email: users[0].email });
  res.cookies.set(CLIENT_COOKIE, makeClientToken(users[0].email), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}

