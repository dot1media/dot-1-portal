import { NextResponse } from "next/server";
import { makeToken, ADMIN_COOKIE, verifyPassword } from "@/lib/auth";
import { ensureAdminTable, isDot1Email, getAdminHash, adminCookieOpts, getSuiteAccount } from "@/lib/admins";

export const runtime = "nodejs";

// One admin login for the whole suite. Verifies against admin_accounts and sets a cookie on
// .dot1.media so every *.dot1.media app recognizes the session.
export async function POST(request: Request) {
  if (!process.env.SESSION_SECRET) {
    return NextResponse.json({ error: "Admin login isn't configured yet. Set SESSION_SECRET in Vercel." }, { status: 503 });
  }
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  await ensureAdminTable();
  if (!isDot1Email(email)) return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  const hash = await getAdminHash(email);
  if (!hash || !verifyPassword(password, hash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  // Bake the suite access claims into the cookie so every *.dot1.media app knows this person's
  // tier and per-app baseline role without a callback. The hub still reads grants fresh from the
  // DB, so a permission change is reflected there immediately; the cookie refreshes on next login.
  const acct = await getSuiteAccount(email);
  const claims = acct ? { tier: acct.tier, grants: acct.grants } : undefined;

  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(ADMIN_COOKIE, makeToken(email, claims), adminCookieOpts(request.headers.get("host")));
  return res;
}
