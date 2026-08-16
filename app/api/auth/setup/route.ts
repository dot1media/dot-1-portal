import crypto from "crypto";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { makeToken, ADMIN_COOKIE, hashPassword } from "@/lib/auth";
import { ensureAdminTable, adminCount, isDot1Email, adminCookieOpts } from "@/lib/admins";

export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Bootstrap the first admin account, authorized by the current ADMIN_PASSWORD.
// Only works while no admin accounts exist yet.
export async function POST(request: Request) {
  if (!process.env.SESSION_SECRET) return NextResponse.json({ error: "Not configured (SESSION_SECRET)." }, { status: 503 });
  await ensureAdminTable();
  if ((await adminCount()) > 0) return NextResponse.json({ error: "Setup already completed. Please sign in." }, { status: 409 });

  const b = await request.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim();
  const password = String(b.password || "");
  const setupCode = String(b.setupCode || "");

  const gate = process.env.ADMIN_PASSWORD || "";
  if (!gate) return NextResponse.json({ error: "ADMIN_PASSWORD is not set, so first-admin setup can't be authorized." }, { status: 503 });
  if (!setupCode || !safeEqual(setupCode, gate)) return NextResponse.json({ error: "That current admin password is incorrect." }, { status: 403 });
  if (!isDot1Email(email)) return NextResponse.json({ error: "Admin email must be a @dot1.media address." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Choose a password of at least 8 characters." }, { status: 400 });

  await sql`INSERT INTO admin_accounts (email, name, password_hash) VALUES (${email}, ${name}, ${hashPassword(password)}) ON CONFLICT (email) DO NOTHING`;

  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(ADMIN_COOKIE, makeToken(email), adminCookieOpts(request.headers.get("host")));
  return res;
}
