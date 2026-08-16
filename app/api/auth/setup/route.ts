import crypto from "crypto";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { makeToken, ADMIN_COOKIE, hashPassword } from "@/lib/auth";
import { ensureAdminTable, isDot1Email, adminCookieOpts } from "@/lib/admins";

export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Create OR reset an admin account, authorized by the studio master password (ADMIN_PASSWORD).
// Used for first-run setup and as a break-glass recovery if an admin is locked out.
export async function POST(request: Request) {
  if (!process.env.SESSION_SECRET) return NextResponse.json({ error: "Not configured (SESSION_SECRET)." }, { status: 503 });
  await ensureAdminTable();

  const b = await request.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim();
  const password = String(b.password || "");
  const setupCode = String(b.setupCode || "");

  const gate = process.env.ADMIN_PASSWORD || "";
  if (!gate) return NextResponse.json({ error: "ADMIN_PASSWORD is not set, so first-admin setup can't be authorized." }, { status: 503 });
  if (!setupCode || !safeEqual(setupCode, gate)) return NextResponse.json({ error: "That studio master password is incorrect." }, { status: 403 });
  if (!isDot1Email(email)) return NextResponse.json({ error: "Admin email must be a @dot1.media address." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Choose a password of at least 8 characters." }, { status: 400 });

  await sql`INSERT INTO admin_accounts (email, name, password_hash) VALUES (${email}, ${name}, ${hashPassword(password)})
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`;

  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(ADMIN_COOKIE, makeToken(email), adminCookieOpts(request.headers.get("host")));
  return res;
}
