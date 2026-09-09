import { NextResponse } from "next/server";
import { verifyMagicToken, makeClientToken, CLIENT_COOKIE } from "@/lib/auth";
export const runtime = "nodejs";
// Magic link from client emails: verify the signed token, set the client session cookie,
// and redirect into the portal (to the specific session when the token carries one).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") || "";
  const m = verifyMagicToken(token);
  const base = url.origin;
  if (!m || !m.email) return NextResponse.redirect(base + "/?link=expired", 302);
  const dest = base + "/" + (m.sid ? "?open=" + encodeURIComponent(m.sid) : "");
  const res = NextResponse.redirect(dest, 302);
  res.cookies.set(CLIENT_COOKIE, makeClientToken(m.email), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
